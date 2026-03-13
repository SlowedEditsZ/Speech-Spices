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

// 2. بنك الأسئلة
const questions = [
    { id: 1, text: "لو معك رحلة مجانية لشخصين، مين بتأخذ معك من الموجودين وليه؟", category: "خفيف" },
    { id: 2, text: "شو أكثر طبخة بتذكرك بلمة العيلة؟", category: "عائلة" },
    { id: 3, text: "لو صرت رئيس وزراء ليوم واحد، شو أول قرار بتأخذه؟", category: "ضحك" },
    { id: 4, text: "مين أكثر واحد في القعدة 'راعي مشاكل' وهو صغير؟ 😂", category: "عائلة" },
    { id: 5, text: "لو تقدر ترجع بالزمن، لأي سنة بترجع؟", category: "عميق" },
    { id: 6, text: "شو أغرب موقف صار معك في عرس أو مناسبة عائلية؟", category: "ضحك" },
    { id: 7, text: "لو انقطع النت عن العالم كله، شو أول إشي بتعمله؟", category: "خفيف" }
];

// توليد ID فريد للمتصفح (للتأكد من هوية اللاعب)
let myPlayerId = localStorage.getItem("playerId");
if (!myPlayerId) {
    myPlayerId = "player_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("playerId", myPlayerId);
}

// --- دوال صفحة البداية (index.html) ---
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
        // إظهار اللوبي وإخفاء شاشة الدخول (بناءً على ملف index.html اللي بعته)
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('waiting-screen').style.display = 'block';
        initLobby(myRoomCode);
    });
}

function joinRoom() {
    const myName = document.getElementById('playerName').value.trim();
    const myRoomCode = document.getElementById('roomCodeInput').value.trim();

    if (!myName || !myRoomCode) return alert("تأكد من كتابة اسمك وكود الغرفة! 🧐");

    database.ref('rooms/' + myRoomCode).once('value', (snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem("playerName", myName);
            localStorage.setItem("roomCode", myRoomCode);
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('waiting-screen').style.display = 'block';
            initLobby(myRoomCode);
        } else {
            alert("كود الغرفة غير صحيح! ❌");
        }
    });
}

// --- منطق اللوبي (Lobby Logic) ---
function initLobby(code) {
    const myName = localStorage.getItem("playerName");
    document.getElementById('displayRoomCode').innerText = code;

    const playerRef = database.ref('rooms/' + code + '/players/' + myPlayerId);
    const roomRef = database.ref('rooms/' + code);

    // إضافة اللاعب وحذفه تلقائياً عند إغلاق المتصفح
    playerRef.set({ name: myName });
    playerRef.onDisconnect().remove();

    // 🌟 مراقبة اللاعبين والحذف الشامل للغرفة (الحل لطلبك)
    roomRef.child('players').on('value', (snapshot) => {
        const playersList = document.getElementById('playersList');
        if (playersList) playersList.innerHTML = "";

        // إذا لم يعد هناك لاعبين (Snapshot غير موجود أو عدد الأبناء 0)
        if (!snapshot.exists() || snapshot.numChildren() === 0) {
            // مسح المسار بالكامل لضمان عدم بقاء رقم الغرفة مع null
            roomRef.set(null).then(() => {
                console.log("تم تنظيف قاعدة البيانات تماماً 🧹");
                // إذا كان المستخدم لا يزال في الصفحة، نعيده للبداية
                if(document.getElementById('waiting-screen').style.display === 'block') {
                    location.reload(); 
                }
            });
        } else {
            snapshot.forEach((child) => {
                const li = document.createElement('li');
                li.innerText = child.val().name;
                playersList.appendChild(li);
            });
        }
    });

    // إظهار زر البدء للأدمن
    roomRef.child('admin').once('value', (snap) => {
        if (snap.val() === myName) {
            document.getElementById('startGameBtn').style.display = 'inline-block';
        }
    });

    // مراقبة حالة اللعبة للانتقال لشاشة اللعب
    roomRef.child('status').on('value', (snap) => {
        if (snap.val() === "playing") {
            document.getElementById('waiting-screen').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            initGame(code);
        }
    });
}

// --- منطق بدء اللعبة (للأدمن) ---
function startGame() {
    const code = localStorage.getItem("roomCode");
    const randomIndex = Math.floor(Math.random() * questions.length);
    
    database.ref('rooms/' + code).update({
        status: "playing",
        currentQuestionId: questions[randomIndex].id
    });
}

// --- منطق شاشة اللعبة (Game Screen) ---
function initGame(code) {
    const myName = localStorage.getItem("playerName");
    const roomRef = database.ref('rooms/' + code);

    // عرض السؤال الحالي
    roomRef.child('currentQuestionId').on('value', (snapshot) => {
        const qId = snapshot.val();
        if (qId) {
            const question = questions.find(q => q.id === qId);
            if (question) {
                document.getElementById("question-text").innerText = question.text;
            }
        }
    });

    // إظهار زر "التالي" للأدمن فقط داخل game-area
    roomRef.child('admin').once('value', (snap) => {
        if (snap.val() === myName) {
            const area = document.getElementById("game-area");
            area.innerHTML = ""; // تنظيف المنطقة
            const btn = document.createElement('button');
            btn.innerText = "سؤال جديد 🌶️";
            btn.className = "btn-create";
            btn.onclick = () => {
                const nextQ = questions[Math.floor(Math.random() * questions.length)];
                roomRef.update({ currentQuestionId: nextQ.id });
            };
            area.appendChild(btn);
        }
    });
}