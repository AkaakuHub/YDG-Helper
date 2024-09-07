document.addEventListener("DOMContentLoaded", function () {
  const portInput = document.getElementById("port");
  const saveButton = document.getElementById("save");
  const statusText = document.getElementById("status");

  chrome.storage.sync.get("portNumber", function (data) {
    if (data.portNumber) {
      portInput.value = data.portNumber;
    } else {
      portInput.value = 50000;
    }
  });

  saveButton.addEventListener("click", function () {
    const port = parseInt(portInput.value);
    if (port >= 1 && port <= 65535) {
      chrome.storage.sync.set({ portNumber: port }, function () {
        statusText.textContent = "保存しました。";
        setTimeout(function () {
          statusText.textContent = "";
        }, 3000);
      });
    } else {
      statusText.textContent = "無効なポート番号です。";
    }
  });
});