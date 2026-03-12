// 1. إعدادات Firebase تبعتك (انسخها من الموقع وحطها هون)
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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let myName = "";
let myRoomCode = "";

// --- دالة إنشاء غرفة جديدة ---
function createRoom() {
    myName = document.getElementById('playerName').value;
    if (!myName) return alert("اكتب اسمك أولاً! 😉");

    // توليد كود غرفة عشوائي من 4 أرقام
    myRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // إنشاء الغرفة في Firebase
    const roomRef = database.ref('rooms/' + myRoomCode);
    
    roomRef.set({
        admin: myName,
        gameStarted: false,
        players: {}
    }).then(() => {
        joinRoomLogic(myRoomCode); // انضمام تلقائي بعد الإنشاء
    });
}

// --- دالة الانضمام لغرفة موجودة ---
function joinRoom() {
    myName = document.getElementById('playerName').value;
    myRoomCode = document.getElementById('roomCodeInput').value;
    
    if (!myName || !myRoomCode) return alert("تأكد من كتابة اسمك وكود الغرفة! 🧐");

    // التأكد إذا الغرفة موجودة أصلاً
    database.ref('rooms/' + myRoomCode).once('value', (snapshot) => {
        if (snapshot.exists()) {
            joinRoomLogic(myRoomCode);
        } else {
            alert("هاد الكود غلط أو الغرفة مش موجودة! ❌");
        }
    });
}

// --- المنطق المشترك للانضمام والانتظار ---
function joinRoomLogic(code) {
    const playerRef = database.ref('rooms/' + code + '/players').push();
    
    // تخزين اسم اللاعب في الغرفة
    playerRef.set({
        name: myName
    });

    // تحويل الشاشة لغرفة الانتظار
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('waiting-screen').style.display = 'block';
    document.getElementById('displayRoomCode').innerText = code;

    // مراقبة اللاعبين (Real-time)
    database.ref('rooms/' + code + '/players').on('value', (snapshot) => {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = ""; // تنظيف القائمة
        
        snapshot.forEach((childSnapshot) => {
            const player = childSnapshot.val();
            const li = document.createElement('li');
            li.innerText = player.name;
            playersList.appendChild(li);
        });
    });

    // إذا كنت أنت الأدمن، أظهر زر "ابدأ اللعبة"
    database.ref('rooms/' + code + '/admin').once('value', (snapshot) => {
        if (snapshot.val() === myName) {
            document.getElementById('startGameBtn').style.display = 'inline-block';
        }
    });
}