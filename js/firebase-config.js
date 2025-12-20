// Firebase Konfigürasyonu ve Yardımcı Fonksiyonları

// Firebase konfigürasyonu - BURAYA KENDİ FIREBASE BİLGİLERİNİZİ GİRİN
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase'i başlat
let app, database;

try {
    app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log("Firebase başarıyla başlatıldı!");
} catch (error) {
    console.error("Firebase başlatma hatası:", error);
}

// Database referansları
const DB_REFS = {
    participants: () => database.ref('participants'),
    draws: () => database.ref('draws'),
    stats: () => database.ref('stats')
};

// Katılımcıları getir (Promise döndürür)
async function getParticipants() {
    try {
        const snapshot = await DB_REFS.participants().once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    } catch (error) {
        console.error("Katılımcılar getirilemedi:", error);
        return [];
    }
}

// Kura sonuçlarını getir
async function getDraws() {
    try {
        const snapshot = await DB_REFS.draws().once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    } catch (error) {
        console.error("Kura sonuçları getirilemedi:", error);
        return [];
    }
}

// Katılımcı ekle
async function addParticipant(participant) {
    try {
        const newParticipantRef = DB_REFS.participants().push();
        participant.id = newParticipantRef.key;
        await newParticipantRef.set(participant);
        return true;
    } catch (error) {
        console.error("Katılımcı eklenemedi:", error);
        return false;
    }
}

// Katılımcıyı güncelle
async function updateParticipant(participantId, updates) {
    try {
        await DB_REFS.participants().child(participantId).update(updates);
        return true;
    } catch (error) {
        console.error("Katılımcı güncellenemedi:", error);
        return false;
    }
}

// Katılımcıyı sil
async function deleteParticipant(participantId) {
    try {
        await DB_REFS.participants().child(participantId).remove();
        return true;
    } catch (error) {
        console.error("Katılımcı silinemedi:", error);
        return false;
    }
}

// Kura sonucu ekle
async function addDraw(draw) {
    try {
        const newDrawRef = DB_REFS.draws().push();
        draw.id = newDrawRef.key;
        await newDrawRef.set(draw);
        return true;
    } catch (error) {
        console.error("Kura sonucu eklenemedi:", error);
        return false;
    }
}

// Tüm kura sonuçlarını sil
async function clearDraws() {
    try {
        await DB_REFS.draws().remove();
        return true;
    } catch (error) {
        console.error("Kura sonuçları silinemedi:", error);
        return false;
    }
}

// Tüm katılımcıları sil
async function clearParticipants() {
    try {
        await DB_REFS.participants().remove();
        await DB_REFS.draws().remove(); // Kura sonuçlarını da sil
        return true;
    } catch (error) {
        console.error("Katılımcılar silinemedi:", error);
        return false;
    }
}

// Katılımcı adına göre bul
async function findParticipantByName(name) {
    try {
        const participants = await getParticipants();
        return participants.find(p => p.name.toLowerCase() === name.toLowerCase());
    } catch (error) {
        console.error("Katılımcı bulunamadı:", error);
        return null;
    }
}

// Kullanıcının kura sonucunu bul
async function findDrawByUser(userName) {
    try {
        const draws = await getDraws();
        return draws.find(d => d.userName === userName);
    } catch (error) {
        console.error("Kura sonucu bulunamadı:", error);
        return null;
    }
}

// Realtime listener - Katılımcılar değiştiğinde
function onParticipantsChange(callback) {
    DB_REFS.participants().on('value', (snapshot) => {
        const data = snapshot.val();
        const participants = data ? Object.values(data) : [];
        callback(participants);
    });
}

// Realtime listener - Kura sonuçları değiştiğinde
function onDrawsChange(callback) {
    DB_REFS.draws().on('value', (snapshot) => {
        const data = snapshot.val();
        const draws = data ? Object.values(data) : [];
        callback(draws);
    });
}

// Listener'ı kapat
function offParticipantsChange() {
    DB_REFS.participants().off();
}

function offDrawsChange() {
    DB_REFS.draws().off();
}

// İstatistikleri güncelle
async function updateStats() {
    try {
        const participants = await getParticipants();
        const draws = await getDraws();
        
        const stats = {
            totalParticipants: participants.length,
            totalDraws: draws.length,
            remainingDraws: participants.length - draws.length,
            lastUpdate: new Date().toISOString()
        };
        
        await DB_REFS.stats().set(stats);
        return stats;
    } catch (error) {
        console.error("İstatistikler güncellenemedi:", error);
        return null;
    }
}
