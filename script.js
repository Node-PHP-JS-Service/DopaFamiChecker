const addfamily = document.getElementById("addfamily");
const families = document.getElementById("families");
const Add = document.getElementById("Add")
const AddFormInputer = Add.querySelector('[name="Inputer"]')
const fileread = document.getElementById("fileread")
const cameraread = document.getElementById("cameraread")
const cameraimage = document.getElementById("cameraimage")
const ctx = cameraimage.getContext("2d");
const QRfile = document.getElementById("QRfile")
const cameravideo = document.getElementById("cameravideo")
const heikinScore = document.getElementById("heikinScore")
const BackupFileExport = document.getElementById("BackupFileExport")
const BackupFileImport = document.getElementById("BackupFileImport")
const heikinlevel = document.getElementById("heikinlevel")
let Table = JSON.parse(localStorage.getItem("Table"))
if(Table === null)
{
    Table = []
    localStorage.setItem("Table", JSON.stringify([]));
}

function toBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

function ScoreisLevel(Score)
{
    const hikakuScore = Score * 1.2
    if(hikakuScore > 100) {
        return "大丈夫"
    } else if(hikakuScore > 80) {
        return "基本大丈夫"
    } else if(hikakuScore > 60) {
        return "ほんの少し中毒"
    } else if(hikakuScore > 40) {
        return "軽度のドーパミン中毒"
    } else if(hikakuScore > 20) {
        return "中程度のドーパミン中毒"
    } else {
        return "重度のドーパミン中毒"
    }
}

function FamiliesUpdate() {
    families.replaceChildren();
    AddFormInputer.replaceChildren();
    let Goukei = 0
    let HighScore = -50
    let HighScoreFamily = ""
    let LowScore = 150
    let LowScoreFamily = ""
    Table.forEach((data) => {
        const dataelement = document.createElement("tr")
        dataelement.innerHTML = `<td>${data.name}</td><td>${data.Level}</td><td>${data.Score}</td><td><button data-name="${data.name}" onclick="DeleteFamily(this.dataset.name)">削除!</button></td>
        <td><button onclick="FamilyNameChange('${data.name}')">更新!</button></td>`;
        families.appendChild(dataelement)
        const Select = document.createElement("option")
        Select.textContent = data.name
        AddFormInputer.appendChild(Select)
        Goukei += Number(data.Score)
        if(HighScore < Number(data.Score)) {
            HighScore = Number(data.Score)
            HighScoreFamily = data.name
        }
        if(LowScore > Number(data.Score)) {
            LowScore = Number(data.Score)
            LowScoreFamily = data.name
        }
    });
    console.log("合計：",Goukei,"テーブル：",Table, "平均：",(Goukei / Table.length).toFixed(2))
    heikinScore.textContent = `平均スコア：${(Goukei / Table.length).toFixed(2)}`
    heikinlevel.textContent = `平均レベル：${ScoreisLevel(Goukei / Table.length)}`
    document.getElementById("highscore").textContent = `ハイスコアの人：${HighScoreFamily} スコア：${HighScore} レベル：${ScoreisLevel(HighScore)}`
    document.getElementById("lowscore").textContent = `最も低いスコアの人：${LowScoreFamily} スコア：${LowScore} レベル：${ScoreisLevel(LowScore)}`
    localStorage.setItem("Table", JSON.stringify(Table));
}
FamiliesUpdate()

function fromBase64(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new TextDecoder().decode(bytes);
}

async function canReadQRCode(file) {
    return new Promise(resolve => {
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(
                0, 0,
                canvas.width,
                canvas.height
            );

            const code = jsQR(
                imageData.data,
                imageData.width,
                imageData.height
            );

            URL.revokeObjectURL(url);

            // QRコードが見つかったか
            resolve(code ? code.data : null);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(false);
        };

        img.src = url;
    });
}

addfamily.addEventListener("submit", (event) => {
    event.preventDefault();
    if(!addfamily.familyname.value) {
        alert("家族名が空です")
        return
    }
    if(!Table.find(obj => obj.name === addfamily.familyname.value)) {
        Table.push({
            name: addfamily.familyname.value,
            Level: null,
            Score: null
        });
        FamiliesUpdate();
    }
    else{
        alert("同じ名前の人がもうすでにいます")
    }
});

Add.addEventListener("submit", (event) => {
    event.preventDefault();
    if(!AddFormInputer.value){
        alert("記入者が入力されていません")
        return
    }
    if(!Add.Base64.value){
        alert("フォームの文字列が入力されていません")
        return
    }
    try {
        let Data = JSON.parse(fromBase64(Add.Base64.value));
        let ChangeData = Table.find(obj => obj.name === AddFormInputer.value)
        ChangeData.Level = Data.level;
        ChangeData.Score = Data.score;
        FamiliesUpdate();
    } catch(e) {
        alert("変換に失敗しました: " + e.name)
    }
});

fileread.onclick = async function()
{
    const file = QRfile.files[0];
    if (!file) return;
    const Kekka = await canReadQRCode(file)

    if (Kekka) {
        alert("QRコードを読めました")
        Add.Base64.value = Kekka
    } else {
        alert("QRコードを読めませんでした")
    }
}

cameraread.onclick = async function()
{
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment"
                },
            audio: false
        });

        cameravideo.srcObject = stream;
        await cameravideo.play();

        function draw() {
            if (cameravideo.readyState >= 2) {
                // カメラ映像をCanvasに描画
                ctx.drawImage(
                    cameravideo,
                    0, 0,
                    cameraimage.width, cameraimage.height
                );
            }

            requestAnimationFrame(draw);
        }

        draw();
        const imageData = ctx.getImageData(
            0, 0, cameraimage.width, cameraimage.height
        );

        const code = jsQR(
            imageData.data,
            imageData.width,
            imageData.height
        );

        if (code) {
            Add.Base64.value = code.data
        }
    } catch (error) {
        alert("カメラが使えません: " + error.name)
        console.error("カメラが使えません: ",error)
    }
}

function DeleteFamily(name)
{
    if(!confirm("本当に削除しますか?")) return
    Table = Table.filter(item => item.name !== name)
    FamiliesUpdate()
}

function FamilyNameChange(name)
{
    let updatename = prompt("名前は何にしますか?")
    if(!Table.find(obj => obj.name === updatename)) {
        Table.find(obj => obj.name === name).name = updatename
        FamiliesUpdate()
    } else {
        alert("同じ名前の人がすでに存在しています")
    }
}

BackupFileExport.addEventListener("click", () => {
    const blob = new Blob([ toBase64(JSON.stringify(Table)) ],{ type:"text/backup" })
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a")
    a.href = url
    a.download = "Backup.bup";
    a.click()
    URL.revokeObjectURL(url)
});

BackupFileImport.addEventListener("click", () => {
    const input = document.createElement("input")
    input.accept = ".bup"
    input.type = "file"
    input.addEventListener("change", (e) => {
        const file = input.files[0];
        let reader = new FileReader()
        reader.addEventListener("load", () => {
            try {
                if(!confirm("本当にインポートしますか?上書きされます。")) return
                Table = JSON.parse(fromBase64(reader.result))
                FamiliesUpdate()
                alert("インポート完了!")
            } catch(e) {
                alert("インポートに失敗しました。" + e.name)
            }
        })
        reader.readAsText(file)
    });
    input.click();
})

document.getElementById("BackupTextMake").addEventListener("click", () => {
    document.getElementById("BackupText").textContent = toBase64(JSON.stringify(Table))
})

document.getElementById("BackupTextLoad").addEventListener("click", () => {
    if(!confirm("本当に更新しますか?上書きされます")) return
    Table = JSON.parse(fromBase64(document.getElementById("BackupTextInput").value))
    FamiliesUpdate()
    alert("更新しました。")
})