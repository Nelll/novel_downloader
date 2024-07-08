// novel_downloader

const booktoki = 'https://booktoki';

// 웹소설 url을 입력해 url 페이지에 있는 본문만 html document 데이터로 반환한다.
async function fetchNovelContent(url)
{
    // fetch()함수는서버로 요청(Request)을 보내고 응답(response)를 받는 함수
    // 함수는 Promise 객체를 반환
    const response = await fetch(url);

    // 서버에서 응답을 못받을 경우
    if(!response.ok)
    {
        // 에러 메시지를 보여준다.
        console.error(`Failed to fetch content from ${url}. Status: ${response.status}`);
        return null;
    }

    // 응답을 읽고 html 텍스트로 반환
    const html = await response.text();
    // DOMParser API
    // HTML, XML 소스 코드를 DOM으로 분석하고 파싱할 수 있는 API 묶음
    // 소스 코드를 DOM 구조로 변환
    // DOMParser는 생성자를 활용하여 DOMParser 객체를 생성하고, 메소드로는 parseFromString() 단 하나 존재한다.
    const parser = new DOMParser(); // DOMParser 객체 생성
    // 첫번째 인자를 string 타입으로 파싱할 문자열을 넣어주면 되고, 두번째는 string 타입의 document 종류를 입력한다.
    // 파싱은 데이터를 분해 분석하여 원하는 형태로 조립하는 걸 말한다.
    const doc = parser.parseFromString(html, 'text/html');
    // html 소스 코드에서 'novel_content' ID 접근
    const content = doc.querySelector('#novel_content');

    // 'novel_content' ID가 없을 경우 에러 메시지를 보여준다.
    if(!content)
    {
        console.error(`Failed to find '#novel_content' on the page: ${url}`);
        return null;
    }

    return cleanText(content.innerHTML);

}

// html 엔티티로 출력되는 html document를 원래 문자로 변환하는 함수
function unescapeHTML(text)
{
    //특수문자가 html 엔티티로 표기되어 본문이 이상하게 출력되는걸 막기위해 예외 처리를 해준다.
    const entities = 
    {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': "'",
        '&#039;': "'",
        '&#nbsp;': ' ',
        '&ndash;': '-',
        '&mdash;': '_',
        '&lsquo;': '‘',
        '&rsquo;': '’',
        '&ldquo;': '“',
        '&rdquo;': '”',
    };

    // Object.entries() 객체를 배열로 변환
    // 객체의 {key: value} 형식을 배열 형태의 [key, value]로 변환
    Object.entries(entities).forEach(([entity, replacement]) => {
        // RegExp() 정규표현식(Regular Expression)
        // 문자열에서 특정 내용을 찾거나 대체 또는 발췌하는데 사용
        // 문자열 전체에서 entity를 찾는다.
        const regex = new RegExp(entity, 'g');
        // 찾은 entity인 regex를 entities의 value로 변환
        text = text.replace(regex, replacement);
    });
    // html entity를 원래 표기해야할 문자로 변환된 문자열을 반환
    return text;
}

// html document에서 tag를 없애는 함수
function cleanText(text)
{
    text = text.replace(/<div>/g, '');
    text = text.replace(/<\div>/g, '');
    text = text.replace(/<p>/g, '\n\n');
    text = text.replace(/<\p>/g, '\n\n');
    text = text.replace(/<br\s*[/]?>/g, '\n');
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/ {2,}/g, ' ');
    text = text.replace(/\n{2,}/g, '\n\n');
    text = unescapeHTML(text);

    return text.trimStart();
}

// 현재 웹페이지에서 모달 팝업창을 보여준다. 
// 일반 팝업창처럼 새로운 탭은 아니고 같은 탭에서 레이어를 쌓아서 보여준다
function createModal()
{
    // HTML
    // modal div 태그 생성
    const modal = document.createElement('div');
    // modal div ID = 'downloadProgressModal' 추가
    modal.id = 'downloadProgressModal';
    // CSS
    modal.style.display = 'block';
    modal.style.position = 'fixed';
    modal.style.zIndex = '1';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.overflow = 'auto';
    modal.style.backgroundColod = 'rgba(0,0,0,0.4)';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fefefe';
    modalContent.style.position = 'relative';
    modalContent.style.margin = '15% auto 0';
    modalContent.style.padding = '20px';
    modalContent.style.border = '1px solid #888';
    modalContent.style.wirdh = '50%';
    modalContent.style.textAlign = 'center';

    modal.appendChild(modalContent);

    return {modal, modalContent};
}

async function downloadNovel(title, episodeLinks, startEpisode)
{
    // text 파일 첫 문장
    let novelText = `${title}`;
    // 비동기처리 시간 지연 함수
    // await 키워드가 붙은 함수(delay)가 반환될 때 까지 해당 지점에서 멈춤
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    // modal과 modalContent 데이터를 createModal() 함수로 반환
    const {modal, modalContent} = createModal();
    // html body 태그 안에 modal 태그를 추가
    document.body.appendChild(modal);

    // download 진행상황을 알려주는 게이지
    const progressBar = document.createElement('div');
    progressBar.style.width = '0%';
    progressBar.style.height = '10px';
    progressBar.style.backgroundColor = '#008CBA';
    progressBar.style.marginTop = '10px';
    progressBar.style.borderRadius = '3px';
    modalContent.appendChild(progressBar);

    // 다운로드 게이지 밑 text 칸
    const progressLabel = document.createElement('div');
    progressLabel.style.marginTop = '5px';
    modalContent.appendChild(progressLabel);

    // 다운로드 시작 시간
    const startTime = new Date();
    // 다운로드 받을 소설 에피소드 개수
    const startingIndex = episodeLinks.length - startEpisode;

    for(let i = startingIndex; i >= 0; i--)
    {
        // 소설 에피소드 링크
        const episodeUrl = episodeLinks[i];

        // booktoki Url의 지정한 에피소드가 없는 경우 로그를 남긴다.
        if(!episodeUrl.startsWith(booktoki)) 
        {
            console.log(`Skipping invalid episode link: ${episodeUrl}`);
            continue;
        }

        // 다운로드중인 에피소드를 로그로 보여준다.
        const logText = `Downloading: ${title} - Episode ${startingIndex - i + 1}/${startingIndex + 1}`;
        console.log(logText);

        // 웹소설 url을 입력해 url 페이지에 있는 본문만 html document 데이터로 반환한다.
        const episodeContent = await fetchNovelContent(episodeUrl);

        // episodeUrl의 html document가 없을 경우
        if(!episodeContent)
        {
            // 에러 메시지
            console.error(`Failed to fetch content for episode: &{episodeUrl}`);
            // 다운로드 게이지 없애기
            progressBar.style.display = 'none';
            progressLabel.style.display = 'none';
            // 에러 메시지 팝업
            const errorLabel = document.createElement('div');
            errorLabel.textContent = "An error occurred. Please check the console for details";
            modalContent.appendChild(errorLabel);
            return;
        }

        // novelText 뒤에 episodeContent 붙이기
        novelText += episodeContent;

        // 다운로드 게이지가 진행률에 따라 퍼센티지가 올라감
        const progress = ((startingIndex - i + 1) / (startingIndex + 1)) * 100;
        progressBar.style.width = `${progress}%`;

        // 경과 시간
        const elapsedTime = new Date() - startTime;
        // 추정된 다운로드가 완료되는 시간
        const estimatedTotalTime = (elapsedTime / progress) * 100;
        // 남은 시간(시)
        const remainingTime = estimatedTotalTime - elapsedTime;
        // 남은 시간(분)
        const remainingMinutes = Math.floor(remainingTime / (1000 * 60));
        // 남은 시간(초)
        const remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

        // 다운로드 게이지 밑 text
        progressLabel.textContent = `Downloading... ${progress.toFixed(2)}% - Remaining Time: ${remainingMinutes}m ${remainingSeconds}s`;

        // await 키워드가 붙은 함수(delay)가 반환될 때 까지 해당 지점에서 멈춤
        // await delay(1000) 1초 지연
        // Math.random() 함수는 0~1 사이의 부동소수점 난수를 생성합니다.
        // Math.random()* 500 은 0 <= random < 500 사이의 부동 소수점 난수를 생성
        // 268.47040397275543 + 1000 = 1268.47040397275543 -> 1.268초 지연
        await delay(Math.random() * 500 + 1000);
    }

    // 다운로드가 끝나면 모달 팝업창을 없애준다.
    document.body.removeChild(modal);

    // txt 파일 이름
    const fileName = `${title}(${startEpisode}~${episodeLinks.length}).txt`;
    // Blob은 대형 이진 객체(Binary Large Object)를 의미하며 일련의 데이터를 처리하거나 간접 참조하는 객체
    // novelText의 text가 Blob 객체의 첫 번째 부분에 들어가게 되고
    // 텍스트가 일반 텍스트임을 나타내는 'text/plain'이라는 정보가 두 번째 부분에 들어가게 된다.
    // 첫 번째 부분은 데이터 타입을 버퍼의 요소로 지정한다.
    const blob = new Blob([novelText], {type: 'text/plain'});
    // html a 태그 생성 
    const a = document.createElement('a');
    // URL.createObjectURL(blob)은 Blob 또는 File 객체를 메모리에서 URL로 변환해주는 역할
    // 이를 통해 Blob 데이터를 다루기 쉬운 URL 형태로 변환하고
    // 웹 페이지에 표시하거나 다운로드 링크로 사용할 수 있습니다.
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    // 실제 눈에 보이는 html은 없기에 a.click()으로 다운로드 링크를 클릭하게 만든다.
    a.click();
    
}

// 타이틀 추출
function extractTitle()
{
    // document 개체의 evaluate() 함수는 XPath를 사용하기 위해 사용됩니다.
    // id="content_wrapper"를 가진 태그 안에 있는 div 첫 번째 태그 안에 있는 span 태그
    const titleElement = document.evaluate('//*[@id="content_wrapper"]/div[1]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // textContent 텍스트노드를 추가한다.
    // trim() 함수는 " 가 나 다 라 마 " -> "가 나 다 라 마" 처럼 문자열의 앞과 뒤쪽의 공백을 제거해준다.
    return titleElement ? titleElement.textContent.trim() : null;
}

// 각 에피소드 링크 추출
function extractEpisodeLinks()
{
    const episodeLinks = [];
    // 소설 에피소드 목록에서 링크 데이터가 포함된 태그의 class 'item-subject' 전체 찾기
    const links = document.querySelectorAll('.item-subject');

    links.forEach(link => {
        // item-subject 태그에 있는 href 요소를 가져와 episodeLinks에 집어넣는다.
        const episodeLink = link.getAttribute('href');
        episodeLinks.push(episodeLink);
    });

    return episodeLinks;
}

// 지정 에피소드 페이지 html document 파싱 추출
async function fetchPage(url)
{
    const response = await fetch(url);
    
    if(!response.ok)
    {
        console.error(`Failed to fetch page: ${url}. status: ${response.status}`);
        return null;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    return doc;
}

// 웹페이지 긁어오기 시작
async function runCrawler()
{
    // 소설 사이트
    const novelPageRule = booktoki;
    // 현재 페이지 링크
    let currentUrl = window.location.href;

    // 불필요한 주소 데이터 삭제
    const urlParts = currentUrl.split('?')[0];
    currentUrl = urlParts;

    // 현재 주소가 지정 소설 사이트가 아닌 경우
    if(!currentUrl.startsWith(novelPageRule))
    {
        console.log('This script should be run on the novel episode list page');
        return;
    }

    // 타이틀 추출
    const title = extractTitle();

    if(!title)
    {
        console.log('Failed to extract the novel title');
        return;
    }

    // prompt() 함수는 문자열을 입력할 때 사용
    // 첫 번째 매개변수는 입력 창에서 띄워줄 메시지
    // 두 번째 매개변수는 입력 부분의 기본 값
    const totalPages = prompt(`소설 목록의 총 페이지 수를 입력하세요`, '1');

    if(!totalPages || isNaN(totalPages))
    {
        console.log('페이지 번호가 잘못되었거나 사용자가 입력을 취소했습니다.');
        return;
    }

    // parseInt(string, radix) 문자열을 숫자로 변환, radix는 수의 진법 (10이면 10진수)
    const totalPagesNumber = parseInt(totalPages, 10);
    const allEpisodeLinks = [];

    for(let page = 1; page <= totalPagesNumber; page++)
    {
        // 소설 에피소드 목록 다음 페이지
        const nextPageUrl = `${currentUrl}?spage=${page}`;
        const nextPageDoc = await fetchPage(nextPageUrl);
        if(nextPageDoc)
        {
            const nextPageLinks = Array.from(nextPageDoc.querySelectorAll('.item-subject')).map(link => link.getAttribute('href'));
            // spread 연산자 (...)를 통한 배열 통합
            allEpisodeLinks.push(...nextPageLinks);
        }
    }

    const startEpisode = prompt(`시작 에피소드 번호를 입력하세요. (1 to ${allEpisodeLinks.length})`, '1');

    if(!startEpisode || isNaN(startEpisode)) 
    {
        console.log('에피소드 번호가 잘못되었거나 사용자가 입력을 취소했습니다.');
        return;
    }

    const startEpisodeNumber = parseInt(startEpisode, 10);

    if(startEpisodeNumber < 1 || startEpisodeNumber > allEpisodeLinks.length)
    {
        console.log('에피소드 번호가 잘못되었습니다. 1부터 총 에피소드 수 사이의 숫자를 입력하세요.');
        return;
    }

    console.log(`추가된 작업: ${title} 다운로드 준비 중 ${startEpisodeNumber} 에피소드부터 다운로드 시작`);

    downloadNovel(title, allEpisodeLinks, startEpisodeNumber);

}

runCrawler();
