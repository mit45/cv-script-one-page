// Kura Çekilişi Sistemi - Ana JavaScript Dosyası

// LocalStorage anahtarları
const STORAGE_KEYS = {
    PARTICIPANTS: 'draw_participants',
    DRAWS: 'draw_results',
    CURRENT_USER: 'current_user'
};

// Kullanıcı giriş kontrolü
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageEl = document.getElementById('loginMessage');

    if (!username || !password) {
        showMessage(messageEl, 'Lütfen tüm alanları doldurun!', 'error');
        return;
    }

    const participants = getParticipants();
    const user = participants.find(p => 
        p.name.toLowerCase() === username.toLowerCase() && 
        p.password === password
    );

    if (!user) {
        showMessage(messageEl, 'Kullanıcı adı veya şifre hatalı!', 'error');
        return;
    }

    // Kullanıcı zaten kura çekmiş mi?
    const draws = getDraws();
    const existingDraw = draws.find(d => d.userName === user.name);

    if (existingDraw) {
        showMessage(messageEl, 'Siz zaten kura çektiniz!', 'error');
        setTimeout(() => {
            showResult(existingDraw.recipient);
        }, 1500);
        return;
    }

    // Başarılı giriş
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.name);
    document.getElementById('currentUser').textContent = user.name;
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('drawSection').style.display = 'block';
}

// Kura çekme fonksiyonu
function drawGift() {
    const selectedNumber = parseInt(document.getElementById('selectedNumber').value);
    const messageEl = document.getElementById('drawMessage');
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    if (!selectedNumber || selectedNumber < 1 || selectedNumber > 100) {
        showMessage(messageEl, 'Lütfen 1-100 arası geçerli bir numara seçin!', 'error');
        return;
    }

    const participants = getParticipants();
    const draws = getDraws();

    // Mevcut kullanıcıyı bul
    const currentParticipant = participants.find(p => p.name === currentUser);
    if (!currentParticipant) {
        showMessage(messageEl, 'Kullanıcı bulunamadı!', 'error');
        return;
    }

    // Kura çekilebilecek kişileri belirle (kendisi hariç ve daha önce seçilmemişler)
    const alreadyAssigned = draws.map(d => d.recipient);
    const availableParticipants = participants.filter(p => 
        p.name !== currentUser && 
        !alreadyAssigned.includes(p.name)
    );

    if (availableParticipants.length === 0) {
        showMessage(messageEl, 'Kura çekilebilecek kimse kalmadı!', 'error');
        return;
    }

    // Seçilen numaraya göre kişi belirle (basit algoritma)
    const index = (selectedNumber - 1) % availableParticipants.length;
    const recipient = availableParticipants[index];

    // Sonucu kaydet
    const drawResult = {
        userName: currentUser,
        selectedNumber: selectedNumber,
        recipient: recipient.name,
        date: new Date().toISOString()
    };

    draws.push(drawResult);
    localStorage.setItem(STORAGE_KEYS.DRAWS, JSON.stringify(draws));

    // Sonucu göster
    showMessage(messageEl, 'Kura çekildi!', 'success');
    setTimeout(() => {
        showResult(recipient.name);
    }, 1000);
}

// Sonucu göster
function showResult(recipientName) {
    document.getElementById('giftRecipient').textContent = recipientName;
    document.getElementById('resultSection').style.display = 'block';
    document.querySelector('.draw-form').style.display = 'none';
}

// Mesaj gösterme yardımcı fonksiyonu
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'message ' + type;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// LocalStorage yardımcı fonksiyonları
function getParticipants() {
    const data = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    return data ? JSON.parse(data) : [];
}

function getDraws() {
    const data = localStorage.getItem(STORAGE_KEYS.DRAWS);
    return data ? JSON.parse(data) : [];
}

function saveParticipants(participants) {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
}

// Sayfa yüklendiğinde kontroller
document.addEventListener('DOMContentLoaded', function() {
    // Eğer draw.html sayfasındaysak ve kullanıcı giriş yapmışsa
    if (document.getElementById('drawSection')) {
        const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        const draws = getDraws();
        
        if (currentUser) {
            const existingDraw = draws.find(d => d.userName === currentUser);
            if (existingDraw) {
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('drawSection').style.display = 'block';
                document.getElementById('currentUser').textContent = currentUser;
                showResult(existingDraw.recipient);
            }
        }
    }
});

// Enter tuşu ile form gönderimi
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        if (document.getElementById('loginSection') && 
            document.getElementById('loginSection').style.display !== 'none') {
            login();
        } else if (document.getElementById('drawSection') && 
                   document.getElementById('drawSection').style.display !== 'none') {
            drawGift();
        }
    }
});
