// Kura Çekilişi Sistemi - Firebase Edition

// Seçilen numara değişkeni
let selectedNumber = null;

// Session storage için kullanıcı
const CURRENT_USER_KEY = 'current_user';

// Kullanıcı kontrolü
async function checkUser() {
    const username = document.getElementById('checkUsername').value.trim();
    const messageEl = document.getElementById('checkMessage');

    if (!username) {
        showMessage(messageEl, 'Lütfen adınızı girin!', 'error');
        return;
    }

    const user = await findParticipantByName(username);

    if (!user) {
        showMessage(messageEl, 'Katılımcı listesinde bulunamadınız!', 'error');
        return;
    }

    // Kullanıcı daha önce kura çekmiş mi kontrol et
    const existingDraw = await findDrawByUser(user.name);

    if (existingDraw) {
        // Şifre kontrolü yap
        sessionStorage.setItem(CURRENT_USER_KEY, user.name);
        document.getElementById('checkUserSection').style.display = 'none';
        document.getElementById('returningUser').textContent = user.name;
        document.getElementById('loginSection').style.display = 'block';
        return;
    }

    // Kullanıcının şifresi var mı?
    if (!user.password) {
        // İlk giriş - şifre oluşturma
        sessionStorage.setItem(CURRENT_USER_KEY, user.name);
        document.getElementById('checkUserSection').style.display = 'none';
        document.getElementById('newUser').textContent = user.name;
        document.getElementById('createPasswordSection').style.display = 'block';
    } else {
        // Şifresi var ama kura çekmemiş - şifre kontrolü
        sessionStorage.setItem(CURRENT_USER_KEY, user.name);
        document.getElementById('checkUserSection').style.display = 'none';
        document.getElementById('returningUser').textContent = user.name;
        document.getElementById('loginSection').style.display = 'block';
    }
}

// Şifre oluştur
async function createPassword() {
    const password = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const messageEl = document.getElementById('createMessage');
    const currentUser = sessionStorage.getItem(CURRENT_USER_KEY);

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

    // Kullanıcıyı bul ve şifreyi kaydet
    const user = await findParticipantByName(currentUser);
    
    if (user) {
        const success = await updateParticipant(user.id, { password: password });
        
        if (success) {
            showMessage(messageEl, 'Şifre oluşturuldu! Kura çekimine yönlendiriliyorsunuz...', 'success');
            
            setTimeout(() => {
                document.getElementById('createPasswordSection').style.display = 'none';
                document.getElementById('currentUser').textContent = currentUser;
                document.getElementById('drawSection').style.display = 'block';
                createNumberButtons(); // Butonları oluştur
            }, 1500);
        } else {
            showMessage(messageEl, 'Şifre kaydedilirken hata oluştu!', 'error');
        }
    } else {
        showMessage(messageEl, 'Bir hata oluştu!', 'error');
    }
}

// Kullanıcı girişi (şifre ile)
async function login() {
    const password = document.getElementById('password').value.trim();
    const messageEl = document.getElementById('loginMessage');
    const currentUser = sessionStorage.getItem(CURRENT_USER_KEY);

    if (!password) {
        showMessage(messageEl, 'Lütfen şifrenizi girin!', 'error');
        return;
    }

    const user = await findParticipantByName(currentUser);

    if (!user || user.password !== password) {
        showMessage(messageEl, 'Şifre hatalı!', 'error');
        return;
    }

    // Kullanıcı zaten kura çekmiş mi?
    const existingDraw = await findDrawByUser(user.name);

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
            createNumberButtons(); // Butonları oluştur
        }, 1000);
    }
}

// Geri dön
function goBack() {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('createPasswordSection').style.display = 'none';
    document.getElementById('checkUserSection').style.display = 'block';
    document.getElementById('checkUsername').value = '';
    document.getElementById('password').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Numara butonlarını oluştur
async function createNumberButtons() {
    const participants = await getParticipants();
    const totalNumbers = participants.length;
    const buttonContainer = document.getElementById('numberButtons');
    buttonContainer.innerHTML = '';
    
    for (let i = 1; i <= totalNumbers; i++) {
        const button = document.createElement('button');
        button.className = 'number-btn';
        button.textContent = i;
        button.onclick = () => selectNumber(i);
        buttonContainer.appendChild(button);
    }
}

// Numara seç
function selectNumber(number) {
    // Tüm butonlardan seçili sınıfını kaldır
    const allButtons = document.querySelectorAll('.number-btn');
    allButtons.forEach(btn => btn.classList.remove('selected'));
    
    // Seçilen butona seçili sınıfını ekle
    event.target.classList.add('selected');
    
    // Seçilen numarayı kaydet
    selectedNumber = number;
    
    // Seçili numarayı göster
    document.getElementById('selectedNumberText').textContent = number;
    document.getElementById('selectedNumberDisplay').style.display = 'block';
    
    // Kura çek butonunu aktif et
    document.getElementById('drawButton').disabled = false;
}

// Çıkış yap
function logout() {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    document.getElementById('viewResultSection').style.display = 'none';
    document.getElementById('checkUserSection').style.display = 'block';
    document.getElementById('checkUsername').value = '';
}

// Kura çekme fonksiyonu
async function drawGift() {
    const messageEl = document.getElementById('drawMessage');
    const currentUser = sessionStorage.getItem(CURRENT_USER_KEY);

    if (!selectedNumber || selectedNumber < 1) {
        showMessage(messageEl, 'Lütfen geçerli bir numara seçin!', 'error');
        return;
    }

    const participants = await getParticipants();
    const draws = await getDraws();

    // Mevcut kullanıcıyı bul
    const currentParticipant = await findParticipantByName(currentUser);
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

    const success = await addDraw(drawResult);

    if (success) {
        // Sonucu göster
        showMessage(messageEl, 'Kura çekildi!', 'success');
        setTimeout(() => {
            showResult(recipient.name);
        }, 1000);
    } else {
        showMessage(messageEl, 'Kura kaydedilirken hata oluştu!', 'error');
    }
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

// Sayfa yüklendiğinde kontroller
document.addEventListener('DOMContentLoaded', function() {
    // Mevcut kullanıcı varsa temizle
    sessionStorage.removeItem(CURRENT_USER_KEY);
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
