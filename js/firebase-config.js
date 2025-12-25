// Firebase Konfigürasyonu ve Yardımcı Fonksiyonları

// Firebase konfigürasyonu - BURAYA KENDİ FIREBASE BİLGİLERİNİZİ GİRİN
const firebaseConfig = {
    apiKey: "AIzaSyDJ09m3PIjLAMLAFYtcdmJapOAxsqIT96g",
    authDomain: "yilbasi-kura-ebdb1.firebaseapp.com",
    databaseURL: "https://yilbasi-kura-ebdb1-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "yilbasi-kura-ebdb1",
    storageBucket: "yilbasi-kura-ebdb1.firebasestorage.app",
    messagingSenderId: "554708363184",
    appId: "1:554708363184:web:a7d1abd94f16be2e4a9875",
    measurementId: "G-XGKMNDXCTW"
};

// Firebase'i başlat
var app, database, auth;

try {
    app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    auth = firebase.auth();
    
    // Global erişim için window'a ata
    window.app = app;
    window.database = database;
    window.auth = auth;
    
    console.log("Firebase başarıyla başlatıldı!");
} catch (error) {
    console.error("Firebase başlatma hatası:", error);
}

// Database referansları
const DB_REFS = {
    participants: () => database.ref('participants'), // Geriye dönük uyumluluk için
    draws: () => database.ref('draws'), // Geriye dönük uyumluluk için
    stats: () => database.ref('stats'),
    events: () => database.ref('events') // Yeni yapı: Kura Etkinlikleri
};

// Etkinlik Sil
async function deleteEvent(eventId) {
    try {
        await DB_REFS.events().child(eventId).remove();
        return true;
    } catch (error) {
        console.error("Etkinlik silinemedi:", error);
        return false;
    }
}

// Etkinlikleri getir (Kullanıcıya özel)
async function getUserEvents(userId) {
    try {
        const snapshot = await DB_REFS.events().orderByChild('organizerId').equalTo(userId).once('value');
        const data = snapshot.val();
        return data ? Object.entries(data).map(([key, value]) => ({ id: key, ...value })) : [];
    } catch (error) {
        console.error("Etkinlikler getirilemedi:", error);
        return [];
    }
}

// Yeni etkinlik oluştur
async function createEvent(eventData) {
    try {
        const newEventRef = DB_REFS.events().push();
        eventData.id = newEventRef.key;
        eventData.createdAt = new Date().toISOString();
        await newEventRef.set(eventData);
        return eventData.id;
    } catch (error) {
        console.error("Etkinlik oluşturulamadı:", error);
        return null;
    }
}

// Katılımcıları getir (Promise döndürür)
async function getParticipants(eventId = null) {
    try {
        const ref = eventId ? database.ref(`events/${eventId}/participants`) : DB_REFS.participants();
        const snapshot = await ref.once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    } catch (error) {
        console.error("Katılımcılar getirilemedi:", error);
        return [];
    }
}

// Kura sonuçlarını getir
async function getDraws(eventId = null) {
    try {
        const ref = eventId ? database.ref(`events/${eventId}/draws`) : DB_REFS.draws();
        const snapshot = await ref.once('value');
        const data = snapshot.val();
        return data ? Object.values(data) : [];
    } catch (error) {
        console.error("Kura sonuçları getirilemedi:", error);
        return [];
    }
}

// Katılımcı ekle
async function addParticipant(participant, eventId = null) {
    try {
        const ref = eventId ? database.ref(`events/${eventId}/participants`) : DB_REFS.participants();
        const newParticipantRef = ref.push();
        participant.id = newParticipantRef.key;
        await newParticipantRef.set(participant);
        return true;
    } catch (error) {
        console.error("Katılımcı eklenemedi:", error);
        return false;
    }
}

// Katılımcıyı güncelle
async function updateParticipant(participantId, updates, eventId = null) {
    try {
        const ref = eventId ? database.ref(`events/${eventId}/participants`) : DB_REFS.participants();
        await ref.child(participantId).update(updates);
        return true;
    } catch (error) {
        console.error("Katılımcı güncellenemedi:", error);
        return false;
    }
}

// Katılımcıyı sil
async function deleteParticipant(participantId, eventId = null) {
    try {
        const ref = eventId ? database.ref(`events/${eventId}/participants`) : DB_REFS.participants();
        await ref.child(participantId).remove();
        return true;
    } catch (error) {
        console.error("Katılımcı silinemedi:", error);
        return false;
    }
}

// Kura sonucu ekle
async function addDraw(draw, eventId = null) {
    try {
        const ref = eventId ? database.ref(`events/${eventId}/draws`) : DB_REFS.draws();
        const newDrawRef = ref.push();
        draw.id = newDrawRef.key;
        await newDrawRef.set(draw);
        return true;
    } catch (error) {
        console.error("Kura sonucu eklenemedi:", error);
        return false;
    }
}

// Kura sonucunu sil
async function deleteDraw(drawId, eventId = null) {
    try {
        const ref = eventId ? database.ref(`events/${eventId}/draws`) : DB_REFS.draws();
        await ref.child(drawId).remove();
        return true;
    } catch (error) {
        console.error("Kura sonucu silinemedi:", error);
        return false;
    }
}

// Kura sonucunu güncelle
async function updateDraw(drawId, updates, eventId = null) {
    try {
        const ref = eventId ? database.ref(`events/${eventId}/draws`) : DB_REFS.draws();
        await ref.child(drawId).update(updates);
        return true;
    } catch (error) {
        console.error("Kura sonucu güncellenemedi:", error);
        return false;
    }
}

// Tüm kura sonuçlarını sil
async function clearDraws(eventId = null) {
    try {
        const ref = eventId ? database.ref(`events/${eventId}/draws`) : DB_REFS.draws();
        await ref.remove();
        return true;
    } catch (error) {
        console.error("Kura sonuçları silinemedi:", error);
        return false;
    }
}

// Tüm katılımcıları sil
async function clearParticipants(eventId = null) {
    try {
        const pRef = eventId ? database.ref(`events/${eventId}/participants`) : DB_REFS.participants();
        const dRef = eventId ? database.ref(`events/${eventId}/draws`) : DB_REFS.draws();
        
        await pRef.remove();
        await dRef.remove(); // Kura sonuçlarını da sil
        return true;
    } catch (error) {
        console.error("Katılımcılar silinemedi:", error);
        return false;
    }
}

// Katılımcı adına göre bul
async function findParticipantByName(name, eventId = null) {
    try {
        const participants = await getParticipants(eventId);
        return participants.find(p => p.name.toLowerCase() === name.toLowerCase());
    } catch (error) {
        console.error("Katılımcı bulunamadı:", error);
        return null;
    }
}

// Kullanıcının kura sonucunu bul
async function findDrawByUser(userName, eventId = null) {
    try {
        const draws = await getDraws(eventId);
        return draws.find(d => d.user === userName);
    } catch (error) {
        console.error("Kura sonucu bulunamadı:", error);
        return null;
    }
}

// Realtime listener - Katılımcılar değiştiğinde
function onParticipantsChange(callback, eventId = null) {
    const ref = eventId ? database.ref(`events/${eventId}/participants`) : DB_REFS.participants();
    ref.on('value', (snapshot) => {
        const data = snapshot.val();
        const participants = data ? Object.values(data) : [];
        callback(participants);
    });
}

// Realtime listener - Kura sonuçları değiştiğinde
function onDrawsChange(callback, eventId = null) {
    const ref = eventId ? database.ref(`events/${eventId}/draws`) : DB_REFS.draws();
    ref.on('value', (snapshot) => {
        const data = snapshot.val();
        const draws = data ? Object.values(data) : [];
        callback(draws);
    });
}

// Listener'ı kapat
function offParticipantsChange(eventId = null) {
    const ref = eventId ? database.ref(`events/${eventId}/participants`) : DB_REFS.participants();
    ref.off();
}

function offDrawsChange(eventId = null) {
    const ref = eventId ? database.ref(`events/${eventId}/draws`) : DB_REFS.draws();
    ref.off();
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
