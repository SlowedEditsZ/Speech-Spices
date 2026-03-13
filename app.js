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

// توليد ID فريد للمتصفح عشان ما يتكرر اللاعب لو عمل Refresh
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
        status: "waiting"
        // الملاحظة: اللاعب بنضاف فعلياً أول ما يفتح صفحة اللوبي
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

            // فحص إذا الاسم موجود أصلاً في الغرفة
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

// --- دوال صفحة اللوبي (lobby.html) ---
if (window.location.pathname.includes("lobby.html")) {
    const code = localStorage.getItem("roomCode");
    const myName = localStorage.getItem("playerName");

    if (!code || !myName) {
        window.location.href = "index.html";
    } else {
        document.getElementById('displayRoomCode').innerText = code;

        const playerRef = database.ref('rooms/' + code + '/players/' + myPlayerId);
        const roomRef = database.ref('rooms/' + code);

        // إضافة اللاعب للسيرفر
        playerRef.set({ name: myName });

        // السطر السحري: حذف اللاعب تلقائياً عند إغلاق المتصفح أو Refresh
        playerRef.onDisconnect().remove();

        // مراقبة قائمة اللاعبين
        roomRef.child('players').on('value', (snapshot) => {
            const playersList = document.getElementById('playersList');
            if (playersList) playersList.innerHTML = ""; 
            
            if (!snapshot.exists()) {
                // إذا فضيت الغرفة تماماً، احذفها من السيرفر
                roomRef.remove();
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

        // الانتقال لصفحة اللعبة عند تغيير الحالة
        roomRef.child('status').on('value', (snapshot) => {
            if (snapshot.val() === "playing") {
                window.location.href = "game.html";
            }
        });
    }
}

function startGame() {
    const code = localStorage.getItem("roomCode");
    database.ref('rooms/' + code).update({
        status: "playing" 
    });
}

// --- دوال صفحة اللعبة (game.html) ---
if (window.location.pathname.includes("game.html")) {
    const code = localStorage.getItem("roomCode");
    if (!code) {
        window.location.href = "index.html";
    } else {
        console.log("الآن أنت في اللعبة! 🌶️");
        // هون بنقدر نبرمج منطق الأسئلة لاحقاً
    }
}