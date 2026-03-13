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

// 2. تشغيل Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// توليد ID فريد لكل لاعب عشان ما يتكرر لما يعمل Refresh
let myPlayerId = localStorage.getItem("playerId");
if (!myPlayerId) {
    myPlayerId = "player_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("playerId", myPlayerId);
}

// --- دوال صفحة البداية (index.html) ---
function createRoom() {
    const myName = document.getElementById('playerName').value;
    if (!myName) return alert("اكتب اسمك أولاً! 😉");

    const myRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // حفظ البيانات في المتصفح
    localStorage.setItem("playerName", myName);
    localStorage.setItem("roomCode", myRoomCode);

    const roomRef = database.ref('rooms/' + myRoomCode);
    roomRef.set({
        admin: myName,
        status: "waiting",
        players: {}
    }).then(() => {
        window.location.href = "lobby.html"; // الانتقال لصفحة اللوبي
    });
}

function joinRoom() {
    const myName = document.getElementById('playerName').value;
    const myRoomCode = document.getElementById('roomCodeInput').value;
    
    if (!myName || !myRoomCode) return alert("تأكد من كتابة اسمك وكود الغرفة! 🧐");

    database.ref('rooms/' + myRoomCode).once('value', (snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem("playerName", myName);
            localStorage.setItem("roomCode", myRoomCode);
            window.location.href = "lobby.html"; // الانتقال لصفحة اللوبي
        } else {
            alert("هاد الكود غلط أو الغرفة مش موجودة! ❌");
        }
    });
}

// --- دوال صفحة اللوبي (lobby.html) ---
if (window.location.pathname.includes("lobby.html")) {
    const code = localStorage.getItem("roomCode");
    const myName = localStorage.getItem("playerName");

    if (!code || !myName) {
        window.location.href = "index.html"; // إذا مافي بيانات، ارجع للبداية
    } else {
        document.getElementById('displayRoomCode').innerText = code;

        // إضافة اللاعب باستخدام الـ ID الخاص فيه (يمنع التكرار)
        database.ref('rooms/' + code + '/players/' + myPlayerId).set({
            name: myName
        });

        // مراقبة اللاعبين
        database.ref('rooms/' + code + '/players').on('value', (snapshot) => {
            const playersList = document.getElementById('playersList');
            playersList.innerHTML = ""; 
            
            snapshot.forEach((childSnapshot) => {
                const player = childSnapshot.val();
                const li = document.createElement('li');
                li.innerText = player.name;
                playersList.appendChild(li);
            });
        });

        // إظهار زر البدء للأدمن فقط
        database.ref('rooms/' + code + '/admin').once('value', (snapshot) => {
            if (snapshot.val() === myName) {
                document.getElementById('startGameBtn').style.display = 'inline-block';
            }
        });

        // مراقبة حالة اللعبة للانتقال لشاشة اللعب
        database.ref('rooms/' + code + '/status').on('value', (snapshot) => {
            if (snapshot.val() === "playing") {
                window.location.href = "game.html"; // الانتقال لصفحة اللعبة
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
        // هون بنقدر نبلش نعرض الأسئلة واللعبة
        console.log("Welcome to the game!");
        document.getElementById("question-text").innerText = "لو كنت بهار، أي نوع رح تكون وليه؟";
    }
}