/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 *
 * Table of contents generator
 * @param documentNode
 * @constructor
 */

export function Toc(documentNode) {
    this.tree = new TocBlock("H2");
    const headers = documentNode.querySelectorAll("h2, h3, h4, h5, h6");
    let lastBlock = this.tree;

    for (const header of headers) {
        const tocNode = new TocItem(header);
        while (tocNode.level < lastBlock.level && lastBlock !== this.tree) {
            lastBlock = lastBlock.parent;
        }
        if (tocNode.level > lastBlock.level) {
            const tocBlock = new TocBlock(tocNode.level, lastBlock);
            lastBlock.appendChild(tocBlock);
            lastBlock = tocBlock;
        }
        lastBlock.appendChild(tocNode);
    }
}

Toc.prototype.render = function () {
    const toc = this.tree.render();
    toc.addEventListener("click", collapseTocBlock);
    toc.classList.remove("collapse");
    return toc;
};

function TocNode(level) {
    this.level = level;
}

function TocBlock(level, parent) {
    TocNode.call(this, level);
    this.parent = parent;
    this.children = [];
}

function TocItem(header) {
    TocNode.call(this, header.tagName);
    this.text = header.textContent;
    this.href = `#${header.id}`;
}
TocBlock.prototype = Object.create(TocNode.prototype);
TocBlock.prototype.constructor = TocBlock;
TocItem.prototype = Object.create(TocNode.prototype);
TocItem.prototype.constructor = TocItem;

TocBlock.prototype.appendChild = function (child) {
    this.children.push(child);
};
TocBlock.prototype.render = function () {
    const block = document.createElement("ul");
    for (const item of this.children) {
        block.appendChild(item.render());
    }
    block.classList.add("collapse");
    return block;
};
TocItem.prototype.render = function () {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.textContent = this.text;
    link.href = this.href;
    item.appendChild(link);
    return item;
};

function collapseTocBlock(e) {
    if (e.target.tagName === "A") {
        const li = e.target.parentNode;
        const others = li.parentNode.querySelectorAll("li + ul:not(.collapse)");

        for (const other of others) {
            other.classList.add("collapse");
        }

        if (li.nextElementSibling && li.nextElementSibling.tagName === "UL") {
            li.nextElementSibling.classList.toggle("collapse");
        }
    }
}
