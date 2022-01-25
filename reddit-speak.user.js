// ==UserScript==
// @name         RedditSpeak
// @namespace    https://github.com/heikohang/reddit-speak
// @version      0.1
// @description  Reads Reddit posts out loud
// @author       Heiko Häng
// @updateURL    https://github.com/heikohang/reddit-speak/raw/main/reddit-speak.user.js
// @downloadURL  https://github.com/heikohang/reddit-speak/raw/main/reddit-speak.user.js
// @match        https://www.reddit.com/r/*/comments/*
// @icon         https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png
// @grant        GM_addStyle
// ==/UserScript==

async function fetchAudioAzureStream(text, token) {
    const response = await fetch("https://eastus.tts.speech.microsoft.com/cognitiveservices/v1", {
    method: "POST",
    headers: {
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-160kbitrate-mono-mp3",
        "Authorization": token
    },
    body: `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-AU"><voice name="en-AU-NatashaNeural"><prosody rate="0%" pitch="0%">${text}</prosody></voice></speak>`
    });

    console.log("Waiting: response from Azure");

    if(!response.ok) {
        throw new Error("Problem with Azure");
    }

    console.log("Waiting: final response from Azure");
    let blob = await response.blob();
    let url;
    url = window.URL.createObjectURL(blob);
    return url;
}

async function fetchAzureToken() {
    try{
        const response = await fetch("https://cors-heiko.herokuapp.com/https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/", {
        method: "GET",
        headers: {
            "Origin": "null"
        }
        })
        const res = await response.text();
        const token = res.match("token: \"(.+?)\"");
        return token[1];
    } catch(err) {
        console.error(err);
    }
}

async function fetchAudioAzure(text) {
    let azuretoken = await fetchAzureToken("Tere-tere vana kere");
    console.log(azuretoken);
    let azureblob = await fetchAudioAzureStream(text, azuretoken);
    console.log(azureblob);
    return azureblob;
}

function createTTSBox() {
    GM_addStyle(`
    .box {
    position: fixed;
    top: 86vh;
    right: 47px;
    width: 300px;
    height: auto;
    overflow-x: hidden;
    overflow-y: auto
    }

    .tts {
    position: fixed;
    top: 86vh;
    right: 50px;
    width: 160px;
    height: 50px;
    border-radius: 25px;
    background-color: #ffffff;
    border: solid 1px #0054a6;
    color: white;
    font-size: 28px;
    text-align: left;
    color: #0054a6;
    text-align: center;
    cursor: pointer;
    z-index: 999;
    padding: 0
    }
    `);

    var audioplayer = document.createElement("div");
    audioplayer.innerHTML = `
    <div id="audioplayer" class="box">
    <button id="tts-start" class="tts" >Start TTS</button>
    </div>
    `;
    document.body.appendChild(audioplayer);

    document.getElementById("tts-start").addEventListener("click", function(){
        console.log("TTS firing");
        TTS(getArticle());
        document.getElementById("tts-start").disabled = true;
        document.getElementById("tts-start").innerText = "Loading...";
    });
}

function createAudioBox(url) {
    let audiobox_html = `<audio id="audioplayersource" src="${url}" controls autoplay ></audio>`;
    document.getElementById("audioplayer").innerHTML = audiobox_html;
}

function setAudioBoxStream(url) {
    document.getElementById("audioplayersource").src = url;
}

function TTS(text) {
    console.log("Text length: "+text.length);
    const createAudio = async () => {
        try {
            // Defaulting to Azure's TTS
            let azure_blob;
            azure_blob = await fetchAudioAzure(text);
            createAudioBox(azure_blob);
        } catch (Error) {
            console.log(Error);
            document.getElementById("tts-start").innerText = "ERROR";
        }
    }

    createAudio();
}

function getArticle() {
    let article_text = document.getElementsByClassName("usertext-body")[1].innerText;
    return article_text;
}


if(window.location.pathname.length > 1) {
    createTTSBox();
}
