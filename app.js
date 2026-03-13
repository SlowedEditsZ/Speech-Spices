// 1. إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCp_WRFkY9CRWjiX8Wjl5c6hBZa3GkCQUk",
    authDomain: "speech-spices.firebaseapp.com",
    projectId: "speech-spices",
    storageBucket: "speech-spices.firebasestorage.app",
    messagingSenderId: "1004379070220",
    appId: "1:1004379070220:web:fddf5193287b811c363329",
    measurementId: "G-9SLTK687E8",
    databaseURL: "https://speech-spices-default-rtdb.firebaseio.com/"
};

// تشغيل Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 2. بنك الأسئلة (يجب أن يكون متاحاً لكل الدوال)
const questions = [
    { id: 1, text: "لو معك رحلة مجانية لشخصين، مين بتأخذ معك من الموجودين وليه؟", category: "خفيف" },
    { id: 2, text: "شو أكثر طبخة بتذكرك بلمة العيلة؟", category: "عائلة" },
    { id: 3, text: "لو صرت رئيس وزراء ليوم واحد، شو أول قرار بتأخذه؟", category: "ضحك" },
    { id: 4, text: "مين أكثر واحد في القعدة 'راعي مشاكل' وهو صغير؟ 😂", category: "عائلة" },
    { id: 5, text: "لو تقدر ترجع بالزمن، لأي سنة بترجع؟", category: "عميق" },
    { id: 6, text: "شو أغرب موقف صار معك في عرس أو مناسبة عائلية؟", category: "ضحك" },
    { id: 7, text: "لو انقطع النت عن العالم كله، شو أول إشي بتعمله؟", category: "خفيف" }
];

// توليد ID فريد للمتصفح
let myPlayerId = localStorage.getItem("playerId");
if (!myPlayerId) {
    myPlayerId = "player_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("playerId", myPlayerId);
}

// --- دوال صفحة البداية ---
function createRoom() {
    const myName = document.getElementById('playerName').value.trim();
    if (!myName) return alert("اكتب اسمك أولاً! 😉");

    const myRoomCode = Math.floor(1000 + Math.random() * 9000).toString();

    localStorage.setItem("playerName", myName);
    localStorage.setItem("roomCode", myRoomCode);

    database.ref('rooms/' + myRoomCode).set({
        admin: myName,
        status: "waiting",
        players: {} 
    }).then(() => {
        window.location.href = "lobby.html";
    });
}

function joinRoom() {
    const myName = document.getElementById('playerName').value.trim();
    const myRoomCode = document.getElementById('roomCodeInput').value.trim();

    if (!myName || !myRoomCode) return alert("تأكد من كتابة اسمك وكود الغرفة! 🧐");

    const roomRef = database.ref('rooms/' + myRoomCode);

    roomRef.once('value', (snapshot) => {
        if (snapshot.exists()) {
            const roomData = snapshot.val();
            const players = roomData.players || {};

            let nameExists = Object.values(players).some(p => p.name === myName);
            if (nameExists) {
                alert("هالاسم موجود بالغرفة! اختار اسم ثاني 😉");
            } else {
                localStorage.setItem("playerName", myName);
                localStorage.setItem("roomCode", myRoomCode);
                window.location.href = "lobby.html";
            }
        } else {
            alert("كود الغرفة غير صحيح! ❌");
        }
    });
}

// --- دوال صفحة اللوبي ---
if (window.location.pathname.includes("lobby.html")) {
    const code = localStorage.getItem("roomCode");
    const myName = localStorage.getItem("playerName");

    if (!code || !myName) {
        window.location.href = "index.html";
    } else {
        document.getElementById('displayRoomCode').innerText = code;

        const playerRef = database.ref('rooms/' + code + '/players/' + myPlayerId);
        const roomRef = database.ref('rooms/' + code);

        // إضافة اللاعب للسيرفر وحذفه تلقائياً عند المغادرة
        playerRef.set({ name: myName });
        playerRef.onDisconnect().remove();

        // مراقبة قائمة اللاعبين وحذف الغرفة إذا أصبحت فارغة
        const playersRef = database.ref('rooms/' + code + '/players');
        playersRef.on('value', (snapshot) => {
            const playersList = document.getElementById('playersList');
            if (playersList) playersList.innerHTML = "";

            if (!snapshot.exists()) {
                database.ref('rooms/' + code).remove();
            } else {
                snapshot.forEach((childSnapshot) => {
                    const player = childSnapshot.val();
                    const li = document.createElement('li');
                    li.innerText = player.name;
                    if (playersList) playersList.appendChild(li);
                });
            }
        });

        // إظهار زر البدء للأدمن فقط
        roomRef.child('admin').once('value', (snapshot) => {
            if (snapshot.val() === myName) {
                const startBtn = document.getElementById('startGameBtn');
                if (startBtn) startBtn.style.display = 'inline-block';
            }
        });

        // الانتقال للعبة عند تغيير الحالة
        roomRef.child('status').on('value', (snapshot) => {
            if (snapshot.val() === "playing") {
                window.location.href = "game.html";
            }
        });
    }
}

// دالة بدء اللعبة (للأدمن)
function startGame() {
    const code = localStorage.getItem("roomCode");
    if (code) {
        // اختيار أول سؤال عشوائياً قبل الانتقال
        const randomIndex = Math.floor(Math.random() * questions.length);
        const firstQuestionId = questions[randomIndex].id;

        database.ref('rooms/' + code).update({
            status: "playing",
            currentQuestionId: firstQuestionId
        });
    }
}

// --- دوال صفحة اللعبة ---
if (window.location.pathname.includes("game.html")) {
    const code = localStorage.getItem("roomCode");
    const myName = localStorage.getItem("playerName");

    if (!code) {
        window.location.href = "index.html";
    } else {
        const roomRef = database.ref('rooms/' + code);

        // مراقبة السؤال الحالي في Firebase وعرضه
        roomRef.child('currentQuestionId').on('value', (snapshot) => {
            const qId = snapshot.val();
            if (qId) {
                const question = questions.find(q => q.id === qId);
                if (question) {
                    document.getElementById("question-text").innerText = question.text;
                }
            }
        });

        // إظهار زر "سؤال جديد" للأدمن فقط
        roomRef.child('admin').once('value', (snapshot) => {
            if (snapshot.val() === myName) {
                const gameArea = document.getElementById("game-area");
                if (gameArea) {
                    const nextBtn = document.createElement('button');
                    nextBtn.innerText = "السؤال التالي ➡️";
                    nextBtn.className = "btn-create"; 
                    nextBtn.onclick = () => pickRandomQuestion(code);
                    gameArea.appendChild(nextBtn);
                }
            }
        });
    }
}

// دالة اختيار سؤال جديد عشوائياً
function pickRandomQuestion(code) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const selectedQuestion = questions[randomIndex];
    
    database.ref('rooms/' + code).update({
        currentQuestionId: selectedQuestion.id
    });
}