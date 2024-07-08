// novel_downloader

const booktoki = 'https://booktoki';

// ���Ҽ� url�� �Է��� url �������� �ִ� ������ html document �����ͷ� ��ȯ�Ѵ�.
async function fetchNovelContent(url)
{
    // fetch()�Լ��¼����� ��û(Request)�� ������ ����(response)�� �޴� �Լ�
    // �Լ��� Promise ��ü�� ��ȯ
    const response = await fetch(url);

    // �������� ������ ������ ���
    if(!response.ok)
    {
        // ���� �޽����� �����ش�.
        console.error(`Failed to fetch content from ${url}. Status: ${response.status}`);
        return null;
    }

    // ������ �а� html �ؽ�Ʈ�� ��ȯ
    const html = await response.text();
    // DOMParser API
    // HTML, XML �ҽ� �ڵ带 DOM���� �м��ϰ� �Ľ��� �� �ִ� API ����
    // �ҽ� �ڵ带 DOM ������ ��ȯ
    // DOMParser�� �����ڸ� Ȱ���Ͽ� DOMParser ��ü�� �����ϰ�, �޼ҵ�δ� parseFromString() �� �ϳ� �����Ѵ�.
    const parser = new DOMParser(); // DOMParser ��ü ����
    // ù��° ���ڸ� string Ÿ������ �Ľ��� ���ڿ��� �־��ָ� �ǰ�, �ι�°�� string Ÿ���� document ������ �Է��Ѵ�.
    // �Ľ��� �����͸� ���� �м��Ͽ� ���ϴ� ���·� �����ϴ� �� ���Ѵ�.
    const doc = parser.parseFromString(html, 'text/html');
    // html �ҽ� �ڵ忡�� 'novel_content' ID ����
    const content = doc.querySelector('#novel_content');

    // 'novel_content' ID�� ���� ��� ���� �޽����� �����ش�.
    if(!content)
    {
        console.error(`Failed to find '#novel_content' on the page: ${url}`);
        return null;
    }

    return cleanText(content.innerHTML);

}

// html ��ƼƼ�� ��µǴ� html document�� ���� ���ڷ� ��ȯ�ϴ� �Լ�
function unescapeHTML(text)
{
    //Ư�����ڰ� html ��ƼƼ�� ǥ��Ǿ� ������ �̻��ϰ� ��µǴ°� �������� ���� ó���� ���ش�.
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
        '&lsquo;': '��',
        '&rsquo;': '��',
        '&ldquo;': '��',
        '&rdquo;': '��',
    };

    // Object.entries() ��ü�� �迭�� ��ȯ
    // ��ü�� {key: value} ������ �迭 ������ [key, value]�� ��ȯ
    Object.entries(entities).forEach(([entity, replacement]) => {
        // RegExp() ����ǥ����(Regular Expression)
        // ���ڿ����� Ư�� ������ ã�ų� ��ü �Ǵ� �����ϴµ� ���
        // ���ڿ� ��ü���� entity�� ã�´�.
        const regex = new RegExp(entity, 'g');
        // ã�� entity�� regex�� entities�� value�� ��ȯ
        text = text.replace(regex, replacement);
    });
    // html entity�� ���� ǥ���ؾ��� ���ڷ� ��ȯ�� ���ڿ��� ��ȯ
    return text;
}

// html document���� tag�� ���ִ� �Լ�
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

// ���� ������������ ��� �˾�â�� �����ش�. 
// �Ϲ� �˾�âó�� ���ο� ���� �ƴϰ� ���� �ǿ��� ���̾ �׾Ƽ� �����ش�
function createModal()
{
    // HTML
    // modal div �±� ����
    const modal = document.createElement('div');
    // modal div ID = 'downloadProgressModal' �߰�
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
    // text ���� ù ����
    let novelText = `${title}`;
    // �񵿱�ó�� �ð� ���� �Լ�
    // await Ű���尡 ���� �Լ�(delay)�� ��ȯ�� �� ���� �ش� �������� ����
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    // modal�� modalContent �����͸� createModal() �Լ��� ��ȯ
    const {modal, modalContent} = createModal();
    // html body �±� �ȿ� modal �±׸� �߰�
    document.body.appendChild(modal);

    // download �����Ȳ�� �˷��ִ� ������
    const progressBar = document.createElement('div');
    progressBar.style.width = '0%';
    progressBar.style.height = '10px';
    progressBar.style.backgroundColor = '#008CBA';
    progressBar.style.marginTop = '10px';
    progressBar.style.borderRadius = '3px';
    modalContent.appendChild(progressBar);

    // �ٿ�ε� ������ �� text ĭ
    const progressLabel = document.createElement('div');
    progressLabel.style.marginTop = '5px';
    modalContent.appendChild(progressLabel);

    // �ٿ�ε� ���� �ð�
    const startTime = new Date();
    // �ٿ�ε� ���� �Ҽ� ���Ǽҵ� ����
    const startingIndex = episodeLinks.length - startEpisode;

    for(let i = startingIndex; i >= 0; i--)
    {
        // �Ҽ� ���Ǽҵ� ��ũ
        const episodeUrl = episodeLinks[i];

        // booktoki Url�� ������ ���Ǽҵ尡 ���� ��� �α׸� �����.
        if(!episodeUrl.startsWith(booktoki)) 
        {
            console.log(`Skipping invalid episode link: ${episodeUrl}`);
            continue;
        }

        // �ٿ�ε����� ���Ǽҵ带 �α׷� �����ش�.
        const logText = `Downloading: ${title} - Episode ${startingIndex - i + 1}/${startingIndex + 1}`;
        console.log(logText);

        // ���Ҽ� url�� �Է��� url �������� �ִ� ������ html document �����ͷ� ��ȯ�Ѵ�.
        const episodeContent = await fetchNovelContent(episodeUrl);

        // episodeUrl�� html document�� ���� ���
        if(!episodeContent)
        {
            // ���� �޽���
            console.error(`Failed to fetch content for episode: &{episodeUrl}`);
            // �ٿ�ε� ������ ���ֱ�
            progressBar.style.display = 'none';
            progressLabel.style.display = 'none';
            // ���� �޽��� �˾�
            const errorLabel = document.createElement('div');
            errorLabel.textContent = "An error occurred. Please check the console for details";
            modalContent.appendChild(errorLabel);
            return;
        }

        // novelText �ڿ� episodeContent ���̱�
        novelText += episodeContent;

        // �ٿ�ε� �������� ������� ���� �ۼ�Ƽ���� �ö�
        const progress = ((startingIndex - i + 1) / (startingIndex + 1)) * 100;
        progressBar.style.width = `${progress}%`;

        // ��� �ð�
        const elapsedTime = new Date() - startTime;
        // ������ �ٿ�ε尡 �Ϸ�Ǵ� �ð�
        const estimatedTotalTime = (elapsedTime / progress) * 100;
        // ���� �ð�(��)
        const remainingTime = estimatedTotalTime - elapsedTime;
        // ���� �ð�(��)
        const remainingMinutes = Math.floor(remainingTime / (1000 * 60));
        // ���� �ð�(��)
        const remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

        // �ٿ�ε� ������ �� text
        progressLabel.textContent = `Downloading... ${progress.toFixed(2)}% - Remaining Time: ${remainingMinutes}m ${remainingSeconds}s`;

        // await Ű���尡 ���� �Լ�(delay)�� ��ȯ�� �� ���� �ش� �������� ����
        // await delay(1000) 1�� ����
        // Math.random() �Լ��� 0~1 ������ �ε��Ҽ��� ������ �����մϴ�.
        // Math.random()* 500 �� 0 <= random < 500 ������ �ε� �Ҽ��� ������ ����
        // 268.47040397275543 + 1000 = 1268.47040397275543 -> 1.268�� ����
        await delay(Math.random() * 500 + 1000);
    }

    // �ٿ�ε尡 ������ ��� �˾�â�� �����ش�.
    document.body.removeChild(modal);

    // txt ���� �̸�
    const fileName = `${title}(${startEpisode}~${episodeLinks.length}).txt`;
    // Blob�� ���� ���� ��ü(Binary Large Object)�� �ǹ��ϸ� �Ϸ��� �����͸� ó���ϰų� ���� �����ϴ� ��ü
    // novelText�� text�� Blob ��ü�� ù ��° �κп� ���� �ǰ�
    // �ؽ�Ʈ�� �Ϲ� �ؽ�Ʈ���� ��Ÿ���� 'text/plain'�̶�� ������ �� ��° �κп� ���� �ȴ�.
    // ù ��° �κ��� ������ Ÿ���� ������ ��ҷ� �����Ѵ�.
    const blob = new Blob([novelText], {type: 'text/plain'});
    // html a �±� ���� 
    const a = document.createElement('a');
    // URL.createObjectURL(blob)�� Blob �Ǵ� File ��ü�� �޸𸮿��� URL�� ��ȯ���ִ� ����
    // �̸� ���� Blob �����͸� �ٷ�� ���� URL ���·� ��ȯ�ϰ�
    // �� �������� ǥ���ϰų� �ٿ�ε� ��ũ�� ����� �� �ֽ��ϴ�.
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    // ���� ���� ���̴� html�� ���⿡ a.click()���� �ٿ�ε� ��ũ�� Ŭ���ϰ� �����.
    a.click();
    
}

// Ÿ��Ʋ ����
function extractTitle()
{
    // document ��ü�� evaluate() �Լ��� XPath�� ����ϱ� ���� ���˴ϴ�.
    // id="content_wrapper"�� ���� �±� �ȿ� �ִ� div ù ��° �±� �ȿ� �ִ� span �±�
    const titleElement = document.evaluate('//*[@id="content_wrapper"]/div[1]/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    // textContent �ؽ�Ʈ��带 �߰��Ѵ�.
    // trim() �Լ��� " �� �� �� �� �� " -> "�� �� �� �� ��" ó�� ���ڿ��� �հ� ������ ������ �������ش�.
    return titleElement ? titleElement.textContent.trim() : null;
}

// �� ���Ǽҵ� ��ũ ����
function extractEpisodeLinks()
{
    const episodeLinks = [];
    // �Ҽ� ���Ǽҵ� ��Ͽ��� ��ũ �����Ͱ� ���Ե� �±��� class 'item-subject' ��ü ã��
    const links = document.querySelectorAll('.item-subject');

    links.forEach(link => {
        // item-subject �±׿� �ִ� href ��Ҹ� ������ episodeLinks�� ����ִ´�.
        const episodeLink = link.getAttribute('href');
        episodeLinks.push(episodeLink);
    });

    return episodeLinks;
}

// ���� ���Ǽҵ� ������ html document �Ľ� ����
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

// �������� �ܾ���� ����
async function runCrawler()
{
    // �Ҽ� ����Ʈ
    const novelPageRule = booktoki;
    // ���� ������ ��ũ
    let currentUrl = window.location.href;

    // ���ʿ��� �ּ� ������ ����
    const urlParts = currentUrl.split('?')[0];
    currentUrl = urlParts;

    // ���� �ּҰ� ���� �Ҽ� ����Ʈ�� �ƴ� ���
    if(!currentUrl.startsWith(novelPageRule))
    {
        console.log('This script should be run on the novel episode list page');
        return;
    }

    // Ÿ��Ʋ ����
    const title = extractTitle();

    if(!title)
    {
        console.log('Failed to extract the novel title');
        return;
    }

    // prompt() �Լ��� ���ڿ��� �Է��� �� ���
    // ù ��° �Ű������� �Է� â���� ����� �޽���
    // �� ��° �Ű������� �Է� �κ��� �⺻ ��
    const totalPages = prompt(`�Ҽ� ����� �� ������ ���� �Է��ϼ���`, '1');

    if(!totalPages || isNaN(totalPages))
    {
        console.log('������ ��ȣ�� �߸��Ǿ��ų� ����ڰ� �Է��� ����߽��ϴ�.');
        return;
    }

    // parseInt(string, radix) ���ڿ��� ���ڷ� ��ȯ, radix�� ���� ���� (10�̸� 10����)
    const totalPagesNumber = parseInt(totalPages, 10);
    const allEpisodeLinks = [];

    for(let page = 1; page <= totalPagesNumber; page++)
    {
        // �Ҽ� ���Ǽҵ� ��� ���� ������
        const nextPageUrl = `${currentUrl}?spage=${page}`;
        const nextPageDoc = await fetchPage(nextPageUrl);
        if(nextPageDoc)
        {
            const nextPageLinks = Array.from(nextPageDoc.querySelectorAll('.item-subject')).map(link => link.getAttribute('href'));
            // spread ������ (...)�� ���� �迭 ����
            allEpisodeLinks.push(...nextPageLinks);
        }
    }

    const startEpisode = prompt(`���� ���Ǽҵ� ��ȣ�� �Է��ϼ���. (1 to ${allEpisodeLinks.length})`, '1');

    if(!startEpisode || isNaN(startEpisode)) 
    {
        console.log('���Ǽҵ� ��ȣ�� �߸��Ǿ��ų� ����ڰ� �Է��� ����߽��ϴ�.');
        return;
    }

    const startEpisodeNumber = parseInt(startEpisode, 10);

    if(startEpisodeNumber < 1 || startEpisodeNumber > allEpisodeLinks.length)
    {
        console.log('���Ǽҵ� ��ȣ�� �߸��Ǿ����ϴ�. 1���� �� ���Ǽҵ� �� ������ ���ڸ� �Է��ϼ���.');
        return;
    }

    console.log(`�߰��� �۾�: ${title} �ٿ�ε� �غ� �� ${startEpisodeNumber} ���Ǽҵ���� �ٿ�ε� ����`);

    downloadNovel(title, allEpisodeLinks, startEpisodeNumber);

}

runCrawler();
