var myOptionsManager = new OptionsManager();

function newInput(target, value) {
    let div = document.createElement("div");
    let input = document.createElement("input");
    let removeBtn = document.createElement("button");
    input.setAttribute("type", "text");
    removeBtn.innerHTML = "×";
    removeBtn.addEventListener("click", removeInput);
    div.appendChild(input);
    div.appendChild(removeBtn);
    target.appendChild(div);
    if (value)
        input.value = value;
    return input;
}

function newUrlInput(target, value) {
    newInput(target, value).setAttribute("placeholder", "<scheme>://<host><path>");
}

function newParamInput(target, value) {
    newInput(target, value).setAttribute("placeholder", "parameter");
}

function removeInput(event) {
    event.target.parentNode.parentNode.removeChild(event.target.parentNode);
}

function createOptions(target, options, addInputFunc) {
    while (target.firstChild) {
        target.removeChild(target.firstChild);
    }
    for (let value of options) {
        addInputFunc(target, value);
    }
}

function getInputValues(target) {
    let values = [];
    for (let input of target.querySelectorAll("input")) {
        if (input.value)
            values.push(input.value);
    }
    return values;
}

function toggleDone(btn) {
    btn.className = "done";
    setTimeout(function () {
        btn.className = "";
    }, 1500);
}

function init() {
    document.addEventListener("DOMContentLoaded", function () {
        let inputFormUrls = document.getElementById("urls");
        let inputFormParams = document.getElementById("queryParams");
        createOptions(inputFormUrls, myOptionsManager.options.urls, newUrlInput);
        createOptions(inputFormParams, myOptionsManager.options.queryParams, newParamInput);

        document.getElementById("addNewUrl").addEventListener("click", function (e) {
            e.preventDefault();
            newUrlInput(inputFormUrls);
        });
        document.getElementById("addNewParam").addEventListener("click", function (e) {
            e.preventDefault();
            newParamInput(inputFormParams);
        });
        document.getElementById("saveUrls").addEventListener("click", function (e) {
            e.preventDefault();
            let urls = getInputValues(inputFormUrls);
            myOptionsManager.saveOptions({
                urls: urls
            }).then(function () {
                createOptions(inputFormUrls, urls, newUrlInput);
                toggleDone(e.target);
            });
        });
        document.getElementById("saveParams").addEventListener("click", function (e) {
            e.preventDefault();
            let queryParams = getInputValues(inputFormParams);
            myOptionsManager.saveOptions({
                queryParams: queryParams
            }).then(function () {
                createOptions(inputFormParams, queryParams, newParamInput);
                toggleDone(e.target);
            });
        });
        document.getElementById("restoreUrls").addEventListener("click", function (e) {
            e.preventDefault();
            myOptionsManager.saveOptions({
                urls: myOptionsManager.defaultOptions.urls
            }).then(function () {
                createOptions(inputFormUrls, myOptionsManager.defaultOptions.urls, newUrlInput);
                toggleDone(e.target);
            });
        });
        document.getElementById("restoreParams").addEventListener("click", function (e) {
            e.preventDefault();
            myOptionsManager.saveOptions({
                queryParams: myOptionsManager.defaultOptions.queryParams
            }).then(function () {
                createOptions(inputFormParams, myOptionsManager.defaultOptions.queryParams, newParamInput);
                toggleDone(e.target);
            });
        });
    });
}

myOptionsManager.loadOptions(init);
