// ==UserScript==
// @name         地图数据抓取
// @namespace    http://tampermonkey.net/
// @version      2024-05-14
// @description  try to take over the world!
// @author       You
// @match        https://www.google.com/maps/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        GM_cookie
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        GM_download
// @grant        GM_info
// @grant        unsafeWindow
// @grant        window.close
// @run-at       document-end

// ==/UserScript==

(function () {
    'use strict';


    let isFinished = false
    let data = ['店名,地址,网站,电话']
    let index = 0
    // 等待页面加载完毕
    window.addEventListener('load', function () {

        let container = document.createElement("div");
        container.id = "cert-ecloud-export-detail";
        container.innerHTML = `
            <style>
                #log {
                    position: fixed; top: 100px; left: 350px;
                    padding: 10px 20px;
                    height: 600px;width: 800px;
                    color: white;
                    background-color: #525252;
                    opacity: 0.9;
                    display: none;
                    overflow-y:auto
                }
                .clpBtn {
                    position: fixed; top: 60px; left: 350px;
                    padding: 10px 20px;
                    font-size: 16px;
                    color: #fff;
                    background-color: #007bff;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    outline: none;
                    transition: background-color 0.3s ease;
                }
                .clpBtn:hover {
                    background-color: #0056b3;
                }
                .clpBtn:focus {
                    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5);
                }
                .clpBtn:active {
                    transform: translateY(2px);
                }
            </style>
            <button class="clpBtn" id="exportBtn">导出数据</button>
            <div id="log"></div>
            `
        document.body.appendChild(container);

        const button = document.getElementById('exportBtn');
        const logDiv = document.getElementById('log')
        button.addEventListener('click', async function () {
            if (button.innerText === '导出数据') {
                logDiv.style.display = 'block'
                log("准备获取数据...")
                button.innerText = '关闭日志'
                await download()
                button.innerText = '导出数据'
            } else if (button.innerText === '关闭日志') {
                button.innerText = '展开日志'
                logDiv.style.display = 'none'
            } else if (button.innerText === '展开日志') {
                button.innerText = '关闭日志'
                logDiv.style.display = 'block'
            }
        });
    });


    function log(str) {
        let logDiv = document.getElementById('log')
        logDiv.innerText = logDiv.innerText + '\n' + str
    }

    async function download() {
        await waitForScroll()

        const links = await waitForLinks(2)

        log('获取 ' + (links.length - index) + ' 条数据')

        for (; index < links.length; index++) {
            const res = await waitForInfo(links[index], 3)
            data.push(res)
        }
        if (isFinished) {
            log('共获取' + index + '条数据，文件导出...')
            data_to_csv(data.join('\n'), '详情')
            index = 0
        } else {
            await download()
        }
    }


    async function waitForScroll() {
        const scrollDiv = document.querySelector('#QA0Szd > div > div > div.w6VYqd > div:nth-child(2) > div > div.e07Vkf.kA9KIf > div > div > div.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd > div.m6QErb.DxyBCb.kA9KIf.dS8AEf.ecceSd')
        if (scrollDiv) {
            log('滚动下一页');
            scrollDiv.scrollBy(0, 1000)
        }
        if (document.body.innerText.indexOf('没有其他结果了') > 0) {
            log('没有其他结果了 ')
            isFinished = true
        }
    }

    async function waitForInfo(link, timeOut) {
        return new Promise((resolve, reject) => {

            const title = link.getAttribute('aria-label').replace(/·已访问的链接/g, '');
            link.click()
            log(index + '\t' + title)
            setTimeout(function () {
                const divCss = 'div[aria-label="' + title + '"]'
                const divElement = document.querySelector(divCss)
                if (divElement) {
                    let addr = document.querySelector('button[data-tooltip="复制地址"]')
                    addr = addr ? addr.getAttribute('aria-label').replace('地址:', '').replaceAll(',', '，') : ''

                    let web = document.querySelector('a[data-tooltip="打开网站"]')
                    web = web ? web.getAttribute('aria-label').replace('网站:', '').replaceAll(',', '，') : ''

                    let tel = document.querySelector('button[data-tooltip="复制电话号码"]')
                    tel = tel ? tel.getAttribute('aria-label').replace('电话:', '').replaceAll(',', '，') : ''
                    resolve([title.replaceAll(',', '，'), addr, web, tel].toString());
                } else {
                    reject([title.replaceAll(',', '，'), '', '', ''].toString());
                }
            }, timeOut * 1000);
        })
    }


    // 等待结果返回
    async function waitForLinks(timeOut) {

        return new Promise((resolve, reject) => {

            setTimeout(function () {
                const links = document.querySelectorAll("a.hfpxzc");

                if (links.length > 0) {
                    resolve(links);
                } else {
                    reject('获取链接失败');
                }
            }, timeOut * 1000);

        });

    }

    function data_to_csv(data, name) {
        const blob = new Blob([data], {type: "text/csv,charset=UTF-8"});
        const uri = URL.createObjectURL(blob);
        let downloadLink = document.createElement("a");
        downloadLink.href = uri;
        downloadLink.download = name + ".csv" || "temp.csv";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
})();
