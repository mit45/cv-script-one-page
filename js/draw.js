// Kura Çekilişi Sistemi - Ana JavaScript Dosyası

// LocalStorage anahtarları
const STORAGE_KEYS = {
    PARTICIPANTS: 'draw_participants',
    DRAWS: 'draw_results',
    CURRENT_USER: 'current_user'
};

// Kullanıcı kontrolü
function checkUser() {
    const username = document.getElementById('checkUsername').value.trim();
    const messageEl = document.getElementById('checkMessage');

    if (!username) {
        showMessage(messageEl, 'Lütfen adınızı girin!', 'error');
        return;
    }

    const participants = getParticipants();
    const user = participants.find(p => 
        p.name.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
        showMessage(messageEl, 'Katılımcı listesinde bulunamadınız!', 'error');
        return;
    }

    // Kullanıcı daha önce kura çekmiş mi kontrol et
    const draws = getDraws();
    const existingDraw = draws.find(d => d.userName === user.name);

    if (existingDraw) {
        // Şifre kontrolü yap
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.name);
        document.getElementById('checkUserSection').style.display = 'none';
        document.getElementById('returningUser').textContent = user.name;
        document.getElementById('loginSection').style.display = 'block';
        return;
    }

    // Kullanıcının şifresi var mı?
    if (!user.password) {
        // İlk giriş - şifre oluşturma
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.name);
        document.getElementById('checkUserSection').style.display = 'none';
        document.getElementById('newUser').textContent = user.name;
        document.getElementById('createPasswordSection').style.display = 'block';
    } else {
        // Şifresi var ama kura çekmemiş - şifre kontrolü
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.name);
        document.getElementById('checkUserSection').style.display = 'none';
        document.getElementById('returningUser').textContent = user.name;
        document.getElementById('loginSection').style.display = 'block';
    }
}

// Şifre oluştur
function createPassword() {
    const password = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const messageEl = document.getElementById('createMessage');
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    if (!password || !confirmPassword) {
        showMessage(messageEl, 'Lütfen tüm alanları doldurun!', 'error');
        return;
    }

    if (password.length < 4) {
        showMessage(messageEl, 'Şifre en az 4 karakter olmalıdır!', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage(messageEl, 'Şifreler eşleşmiyor!', 'error');
        return;
    }

    // Şifreyi kaydet
    const participants = getParticipants();
    const userIndex = participants.findIndex(p => p.name === currentUser);
    
    if (userIndex !== -1) {
        participants[userIndex].password = password;
        saveParticipants(participants);
        
        showMessage(messageEl, 'Şifre oluşturuldu! Kura çekimine yönlendiriliyorsunuz...', 'success');
        
        setTimeout(() => {
            document.getElementById('createPasswordSection').style.display = 'none';
            document.getElementById('currentUser').textContent = currentUser;
            document.getElementById('drawSection').style.display = 'block';
        }, 1500);
    } else {
        showMessage(messageEl, 'Bir hata oluştu!', 'error');
    }
}

// Kullanıcı girişi (şifre ile)
function login() {
    const password = document.getElementById('password').value.trim();
    const messageEl = document.getElementById('loginMessage');
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

    if (!password) {
        showMessage(messageEl, 'Lütfen şifrenizi girin!', 'error');
        return;
    }

    const participants = getParticipants();
    const user = participants.find(p => p.name === currentUser);

    if (!user || user.password !== password) {
        showMessage(messageEl, 'Şifre hatalı!', 'error');
        return;
    }

    // Kullanıcı zaten kura çekmiş mi?
    const draws = getDraws();
    const existingDraw = draws.find(d => d.userName === user.name);

    if (existingDraw) {
        // Sadece sonuçları göster
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('viewUser').textContent = user.name;
        document.getElementById('viewGiftRecipient').textContent = existingDraw.recipient;
        document.getElementById('viewSelectedNumber').textContent = existingDraw.selectedNumber;
        document.getElementById('viewResultSection').style.display = 'block';
    } else {
        // Kura çekimine yönlendir
        showMessage(messageEl, 'Giriş başarılı!', 'success');
        setTimeout(() => {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('currentUser').textContent = currentUser;
            document.getElementById('drawSection').style.display = 'block';
        }, 1000);
    }
}

// Geri dön
function goBack() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('createPasswordSection').style.display = 'none';
    document.getElementById('checkUserSection').style.display = 'block';
    document.getElementById('checkUsername').value = '';
    document.getElementById('password').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Çıkış yap
function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    document.getElementById('viewResultSection').style.display = 'none';
    document.getElementById('checkUserSection').style.display = 'block';
    document.getElementById('checkUsername').value = '';
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
    // Mevcut kullanıcı varsa temizle
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
});

// Enter tuşu ile form gönderimi
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const checkUserSection = document.getElementById('checkUserSection');
        const createPasswordSection = document.getElementById('createPasswordSection');
        const loginSection = document.getElementById('loginSection');
        const drawSection = document.getElementById('drawSection');
        
        if (checkUserSection && checkUserSection.style.display !== 'none') {
            checkUser();
        } else if (createPasswordSection && createPasswordSection.style.display !== 'none') {
            createPassword();
        } else if (loginSection && loginSection.style.display !== 'none') {
            login();
        } else if (drawSection && drawSection.style.display !== 'none') {
            drawGift();
        }
    }
});
