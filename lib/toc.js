/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 *
 * Table of contents generator
 * @param documentNode
 * @constructor
 */

function Toc(documentNode) {
    this.tree = new TocBlock("H2");
    let headers = documentNode.querySelectorAll("h2, h3, h4, h5, h6");
    let lastBlock = this.tree;

    for (let header of headers) {
        let tocNode = new TocItem(header);
        while (tocNode.level < lastBlock.level && lastBlock !== this.tree) {
            lastBlock = lastBlock.parent;
        }
        if (tocNode.level > lastBlock.level) {
            let tocBlock = new TocBlock(tocNode.level, lastBlock);
            lastBlock.appendChild(tocBlock);
            lastBlock = tocBlock;
        }
        lastBlock.appendChild(tocNode);
    }
}

Toc.prototype.render = function () {
    return this.tree.render();
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
    this.href = "#" + header.id;
}
TocBlock.prototype = Object.create(TocNode.prototype);
TocBlock.prototype.constructor = TocBlock;
TocItem.prototype = Object.create(TocNode.prototype);
TocItem.prototype.constructor = TocItem;

TocBlock.prototype.appendChild = function (child) {
    this.children.push(child);
};
TocBlock.prototype.render = function () {
    let block = document.createElement("ul");
    for (let item of this.children) {
        block.appendChild(item.render());
    }
    return block;
};
TocItem.prototype.render = function () {
    let item = document.createElement("li");
    let link = document.createElement("a");
    link.textContent = this.text;
    link.href = this.href;
    item.appendChild(link);
    return item;
};