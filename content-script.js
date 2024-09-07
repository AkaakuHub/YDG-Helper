function addButtonToVideoRenderer(videoRenderer) {
    // すでにボタンが追加されているか確認
    if (videoRenderer.querySelector(".fetch-url-button")) return;

    const thumbnailElement = videoRenderer.querySelector("a#thumbnail");
    if (!thumbnailElement) return;

    const videoUrl = thumbnailElement.href;

    const button = document.createElement("button");
    button.innerText = "Send URL";
    button.className = "fetch-url-button";

    button.addEventListener("click", () => {
        chrome.storage.sync.get('portNumber', function (data) {
            const port = data.portNumber || 50000;
            fetch(`http://localhost:${port}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url: videoUrl }),
            })
                .then(response => response.text())
                .then(data => console.log("Response from server:", data))
                .catch(error => console.error("Error:", error));
        });
    });

    const textWrapper = videoRenderer.querySelector('div.text-wrapper.style-scope.ytd-video-renderer:not(#meta)') ||
        videoRenderer.querySelector('div.text-wrapper.style-scope.ytd-radio-renderer:not(#meta)');

    if (textWrapper) {
        textWrapper.insertAdjacentElement('afterend', button);
    } else {
        videoRenderer.appendChild(button);
    }
}

// MutationObserver のコールバック関数
function mutationCallback(mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches("ytd-video-renderer, ytd-radio-renderer")) {
                        addButtonToVideoRenderer(node);
                    } else {
                        node.querySelectorAll("ytd-video-renderer, ytd-radio-renderer").forEach(addButtonToVideoRenderer);
                    }
                }
            });
        }
    }
}

// MutationObserver の設定
const observer = new MutationObserver(mutationCallback);
const config = { childList: true, subtree: true };

// 監視を開始
function startObserver() {
    const targetNode = document.querySelector("ytd-app");
    if (targetNode) {
        observer.observe(targetNode, config);
        console.log("MutationObserver started");
    } else {
        console.log("Target node not found, retrying in 1 second");
        setTimeout(startObserver, 1000);
    }
}

// 初期のビデオレンダラー要素にもボタンを追加
function initialAddButtons() {
    document.querySelectorAll("ytd-video-renderer, ytd-radio-renderer").forEach(addButtonToVideoRenderer);
}

// スクリプトの実行
startObserver();
initialAddButtons();