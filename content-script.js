function createButton(kind, videoUrl) {
    const button = document.createElement("button");
    button.innerText = "Send URL";
    button.className = `fetch-url-button button-${kind}`;

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
    return button;
}

function addButton(kind, node) {
    let videoUrl, targetElm;

    if (kind === "ytR") {
        // videoRenderer = document.querySelector("ytd-video-renderer") || document.querySelector("ytd-radio-renderer");
        if (!node || node.querySelector(".fetch-url-button")) return;

        const thumbnailElement = node.querySelector("a#thumbnail");
        if (!thumbnailElement) return;

        videoUrl = thumbnailElement.href;
        targetElm = node.querySelector('div.text-wrapper.style-scope.ytd-video-renderer:not(#meta)') ||
            node.querySelector('div.text-wrapper.style-scope.ytd-radio-renderer:not(#meta)');

        if (targetElm) {
            targetElm.insertAdjacentElement('afterend', createButton(kind, videoUrl));
        }
    } else if (kind === "ytW") {
        // videoRenderer = document.querySelector(".middle-row");
        if (!node || node.querySelector(".fetch-url-button")) return;

        videoUrl = location.href;
        if (node) {
            node.insertAdjacentElement('beforeend', createButton(kind, videoUrl));
        }
    }
}

// MutationObserver のコールバック関数
function mutationCallback(mutationsList, observer, kind) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    switch (kind) {
                        case "ytR":
                            if (node.matches("ytd-video-renderer, ytd-radio-renderer")) {
                                addButton("ytR", node);
                            } else {
                                node.querySelectorAll("ytd-video-renderer, ytd-radio-renderer").forEach(node => addButton("ytR", node));
                            }
                            break;
                        case "ytW":
                            if (node.matches("div.style-scope.ytd-watch-metadata#middle-row")) {
                                addButton("ytW", node);
                            } else {
                                node.querySelectorAll("div.style-scope.ytd-watch-metadata#middle-row").forEach(node => addButton("ytW", node));
                            }
                            break;
                        default:
                            break;
                    }
                }
            });
        }
    }
}

// 監視を開始する関数
function startObserver(query, kind) {
    const targetNode = document.querySelector(query);
    if (targetNode) {
        const observer = new MutationObserver((mutationsList, observer) => mutationCallback(mutationsList, observer, kind));
        const config = { childList: true, subtree: true };
        observer.observe(targetNode, config);
        console.log("YDG-Helper: MutationObserver started");
    } else {
        console.log("YDG-Helper: Target node not found, retrying in 1 second");
        setTimeout(() => startObserver(query, kind), 1000);
    }
}

// URL変更の検出
let oldHref = document.location.href;

function checkUrlChange() {
    if (oldHref !== document.location.href) {
        oldHref = document.location.href;
        console.log("YDG-Helper: URLが変更されました: ");
        main();
    }
}

// URL変更を監視するために `popstate` イベントをリッスン
window.addEventListener('popstate', checkUrlChange);

// `history.pushState` と `history.replaceState` をオーバーライドしてURL変更を検出
const pushState = history.pushState;
history.pushState = function () {
    pushState.apply(history, arguments);
    checkUrlChange();
};

const replaceState = history.replaceState;
history.replaceState = function () {
    replaceState.apply(history, arguments);
    checkUrlChange();
};

// MutationObserverを使用してDOMの変化を監視し、URLの変化を再確認
const observer = new MutationObserver(mutations => {
    mutations.forEach(() => {
        checkUrlChange();
    });
});

const config = { childList: true, subtree: true };

// メイン処理
function main() {
    const currentDomain = location.hostname;
    switch (currentDomain) {
        case "www.youtube.com":
            if (location.pathname.startsWith("/results")) {
                startObserver("ytd-app", "ytR");
                document.querySelectorAll("ytd-video-renderer, ytd-radio-renderer").forEach(node => addButton("ytR", node));
            } else if (location.pathname.startsWith("/watch")) {
                startObserver("ytd-app", "ytW");
                document.querySelectorAll("div.style-scope.ytd-watch-metadata#middle-row").forEach(node => addButton("ytW", node));
            }
            break;
        default:
            break;
    }
}

// 初期ロード時またはDOMが準備できたタイミングでメイン処理を実行
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        main();
        observer.observe(document.body, config);
    });
} else {
    main();
    observer.observe(document.body, config);
}
