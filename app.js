// إعدادات Firebase
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
        players: {} // لضمان وجود قسم اللاعبين
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

            // التحقق من تكرار الاسم
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
        const adminRef = database.ref('rooms/' + code + '/admin');
        const statusRef = database.ref('rooms/' + code + '/status');

        // إضافة اللاعب
        playerRef.set({ name: myName });

        // حذف اللاعب عند إغلاق المتصفح
        playerRef.onDisconnect().remove();
        adminRef.onDisconnect().remove();
        statusRef.onDisconnect().remove();

        // مراقبة اللاعبين
        const playersRef = database.ref('rooms/' + code + '/players');
        playersRef.on('value', (snapshot) => {
            const playersList = document.getElementById('playersList');
            if (playersList) playersList.innerHTML = "";

            if (!snapshot.exists() || snapshot.numChildren() === 0) {
                // إذا الغرفة فاضية، احذفها
                database.ref('rooms/' + code).remove();
                // إيقاف الاستماع
                playersRef.off();
                // إعادة التوجيه أو أي إجراء آخر
                window.location.href = "index.html";
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

function startGame() {
    const code = localStorage.getItem("roomCode");
    if (code) {
        database.ref('rooms/' + code).update({
            status: "playing"
        });
    }
}

// --- دوال صفحة اللعبة ---
if (window.location.pathname.includes("game.html")) {
    const code = localStorage.getItem("roomCode");
    if (!code) {
        window.location.href = "index.html";
    } else {
        console.log("الآن أنت في اللعبة! 🌶️");
        // هنا تبرمج منطق الأسئلة لاحقاً
    }
}