const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

const escapeStringRegexp = function (str) {
    return str.replace(matchOperatorsRe, "\\$&");
};

const BACKSPACE = 8,
    TAB = 9,
    ENTER = 13,
    LEFT = 37,
    RIGHT = 39,
    DELETE = 46;

const COPY_PROPS = ["autocomplete", "disabled", "readonly", "type"];
const MOVE_PROPS = ["accept", "accesskey", "autocapitalize", "autofocus", "dir", "inputmode",
    "lang", "list", "max", "maxlength", "min", "minlength", "pattern", "placeholder", "size",
    "spellcheck", "step", "tabindex", "title"];

function checkerForSeparator(separator) {
    function simple(separator) {
        return {
            split: s => !s || !s.trim() ? [] : s.split(separator),
            join: arr => arr.join(separator),
            test: char => char === separator
        };
    }

    function multi(separators) {
        let regex = separators
            .split("")
            .map(escapeStringRegexp)
            .join("|");

        regex = new RegExp(regex);

        return {
            split: s => !s || !s.trim() ? [] : s.split(regex),
            join: arr => arr.join(separators[0]),
            test: char => regex.test(char)
        };
    }

    return separator.length > 1 ? multi(separator) : simple(separator);
}

function createElement(type, name, text, attributes) {
    let el = document.createElement(type);
    if (name) el.className = name;
    if (text) el.textContent = text;
    for (let key in attributes) {
        if (attributes.hasOwnProperty(key)) {
            el.setAttribute(key, attributes[key]);
        }
    }
    return el;
}

function insertAfter(child, el) {
    return child.nextSibling ?
        child.parentNode.insertBefore(el, child.nextSibling) :
        child.parentNode.appendChild(el);
}

function caretAtStart(el) {
    try {
        return el.selectionStart === 0 && el.selectionEnd === 0;
    }
    catch (e) {
        return el.value === "";
    }
}

function charFromKeyboardEvent(e) {
    return e.key;
}

const eachNode = "forEach" in NodeList.prototype ?
    (nodeList, fn) => nodeList.forEach(fn) :
    (nodeList, fn) => {
        for (let i = 0; i < nodeList.length; i++) fn(nodeList[i]);
    };

export function TagsInput(input) {

    function $(selector) {
        return base.querySelector(selector);
    }

    function $$(selector) {
        return base.querySelectorAll(selector);
    }

    function getValue() {
        let value = [];
        //if (base.input.value) value.push(base.input.value);
        eachNode($$(".tag"), t => value.push(t.textContent));
        return value;
    }

    function setValue(values) {
        if (!values) {
            return;
        }

        if (typeof values === "string") {
            values = [values];
        }

        let container = document.createDocumentFragment();
        let tagNode = document.createElement("span");
        tagNode.className = "tag";

        while (base.tags.hasChildNodes()) {
            base.tags.removeChild(base.tags.lastChild);
        }

        for (let value of values) {
            let clone = tagNode.cloneNode(false);
            clone.textContent = value;
            clone.dataset.tag = value;
            container.appendChild(clone);
        }

        base.tags.appendChild(container);
        input.value = values.join();
    }

    function save() {
        input.value = checker.join(getValue());
        input.dispatchEvent(new Event("change", {"bubbles": true}));
    }

    function checkAllowDuplicates() {
        const allow =
            input.getAttribute("data-allow-duplicates") ||
            input.getAttribute("duplicates");
        return allow === "on" || allow === "1" || allow === "true";
    }

    function getElementBefore(tag) {
        for (let element of $$(".tag")) {
            if (tag < element.dataset.tag) {
                return element;
            }
        }
        return null;
    }

    // Return false if no need to add a tag
    function addTag(text, edited) {
        let added = false;

        function addOneTag(text) {
            let tag = text && text.trim();
            // Ignore if text is empty
            if (!tag) return;

            if (!base.input.checkValidity()) {
                let editedTag = $(".tag.editing");
                if (!editedTag) {
                    base.classList.add("error");
                    setTimeout(() => base.classList.remove("error"), 150);
                } else {
                    editedTag.classList.add("dupe");
                    setTimeout(() => editedTag.classList.remove("dupe"), 100);
                    base.input.value = "";
                }
                return;
            }

            // For duplicates, briefly highlight the existing tag
            if (!allowDuplicates) {
                let exisingTag = $(`[data-tag="${tag}"]`);
                if (exisingTag) {
                    exisingTag.classList.add("dupe");
                    setTimeout(() => exisingTag.classList.remove("dupe"), 100);
                    return;
                }
            }

            let element = createElement("span", "tag", tag, {"data-tag": tag});

            if (edited) {
                base.tags.replaceChild(element, edited);
            } else {
                let before = getElementBefore(tag);
                if (before != null) {
                    base.tags.insertBefore(element, before);
                } else {
                    base.tags.appendChild(element);
                }
            }
            added = true;
        }

        // Add multiple tags if the user pastes in data with SEPERATOR already in it
        checker.split(text).forEach(addOneTag);
        return added;
    }

    function select(el) {
        let sel = $(".selected");
        if (sel) {
            sel.classList.remove("selected");
            sel.classList.remove("editing");
            sel.blur();
            sel.removeAttribute("contenteditable");
        }
        if (el) {
            el.classList.add("selected");
            el.setAttribute("contenteditable", "true");
        }
    }

    function savePartialInput(value, edited) {
        if (typeof value !== "string" && !Array.isArray(value)) {
            // If the base input does not contain a value, default to the original element passed
            value = base.input.value;
        }
        if (addTag(value, edited) !== false) {
            base.input.value = "";
            save();
            return true;
        }
        return false;
    }

    function saveTagEdit(tag) {
        if (tag.textContent === tag.dataset.tag) {
            tag.blur();
            select();
            return true;
        }
        base.input.value = tag.textContent;
        let saved = savePartialInput(tag.textContent, tag);
        base.input.value = "";
        return saved;
    }

    function refocus(e) {
        if (e.target.classList.contains("tag")) {
            if (e.target.classList.contains("selected")) {
                e.target.classList.add("editing");
                return;
            } else {
                // focus base.input to capture input
                base.input.focus();
            }
            select(e.target);
            e.preventDefault();
            return false;
        } else {
            base.input.select();
            if (e.target === base.input) {
                return select();
            } else {
                e.preventDefault();
                return false;
            }
        }
    }

    const base = createElement("div", "tags-input card"),
        checker = checkerForSeparator(input.getAttribute("data-separator") || ","),
        allowDuplicates = checkAllowDuplicates();

    let inputType = input.getAttribute("type");
    if (!inputType || inputType === "tags") {
        input.setAttribute("type", "text");
    }
    base.input = createElement("input");
    COPY_PROPS.forEach(prop => {
        if (input.hasAttribute(prop)) {
            base.input.setAttribute(prop, input.getAttribute(prop));
        }
    });
    MOVE_PROPS.forEach(prop => {
        if (input.hasAttribute(prop)) {
            base.input.setAttribute(prop, input.getAttribute(prop));
            input.removeAttribute(prop);
        }
    });

    input.setAttribute("type", "text");
    input.tabIndex = -1;

    input.addEventListener("focus", () => {
        base.input.focus();
    });

    base.input.addEventListener("focus", () => {
        base.classList.add("focus");
        select();
    });

    base.input.addEventListener("blur", () => {
        if ($(".tag.editing")) {
            return;
        }
        base.classList.remove("focus");
        select();
        savePartialInput();
    });

    base.input.addEventListener("keydown", e => {
        let el = base.input,
            key = e.keyCode || e.which,
            separator = checker.test(charFromKeyboardEvent(e)),
            selectedTag = $(".tag.selected"),
            lastTag = $(".tag:last-of-type");

        if (key === ENTER || key === TAB || separator) {
            if (!el.value && !separator) return;
            savePartialInput();
        }
        else if (key === DELETE && selectedTag) {
            if (selectedTag !== lastTag) select(selectedTag.nextSibling);
            base.tags.removeChild(selectedTag);
            save();
        }
        else if (key === BACKSPACE) {
            if (selectedTag) {
                select(selectedTag.previousSibling);
                base.tags.removeChild(selectedTag);
                save();
            }
            else if (lastTag && caretAtStart(el)) {
                select(lastTag);
            }
            else {
                return;
            }
        }
        else if (key === LEFT) {
            if (selectedTag) {
                if (selectedTag.previousSibling) {
                    select(selectedTag.previousSibling);
                }
            }
            else if (!caretAtStart(el)) {
                return;
            }
            else {
                select(lastTag);
            }
        }
        else if (key === RIGHT) {
            if (!selectedTag) return;
            select(selectedTag.nextSibling);
        }
        else {
            return select();
        }

        e.preventDefault();
        return false;
    });

    // Proxy "input" (live change) events , update the first tag live as the user types
    // This means that users who only want one thing don't have to enter commas
    base.input.addEventListener("input", () => {
        //input.value = getValue();
        input.dispatchEvent(new Event("input"));
    });

    // One tick after pasting, parse pasted text as CSV:
    base.input.addEventListener("paste", () => setTimeout(savePartialInput, 0));

    base.addEventListener("mousedown", refocus);
    base.addEventListener("touchstart", refocus);

    base.setValue = setValue;
    base.getValue = getValue;

    function setDisabled() {
        base.input.setAttribute("disabled", "disabled");
        input.setAttribute("disabled", "disabled");
    }

    function setEnabled() {
        base.input.removeAttribute("disabled");
        input.removeAttribute("disabled");
    }

    base.enable = setEnabled;
    base.disable = setDisabled;

    base.tags = createElement("div");
    base.tags.className = "tags";
    base.tags.addEventListener("keydown", function (e) {
        let key = e.keyCode || e.which,
            separator = checker.test(charFromKeyboardEvent(e)),
            editedTag = e.target;
        if (key === ENTER || key === TAB || separator) {
            if (editedTag.textContent === editedTag.dataset.tag) {
                select();
            } else {
                saveTagEdit(editedTag);
            }
            e.preventDefault();
            return false;
        }
    });
    base.tags.addEventListener("focusout", function (e) {
        let editedTag = e.target;
        if (!saveTagEdit(editedTag)) {
            editedTag.textContent = editedTag.dataset.tag;
            select();
        }
    });

    base.appendChild(base.tags);
    base.appendChild(base.input);
    insertAfter(input, base);
    base.insertBefore(input, base.tags);

    return base;
}
