// Kura Çekilişi Sistemi - Firebase Edition

// URL'den Event ID'yi al
const urlParams = new URLSearchParams(window.location.search);
const EVENT_ID = urlParams.get('id');

// Seeded Shuffle Fonksiyonu (Tutarlı Rastgelelik İçin)
function seededShuffle(array, seed) {
    // Seed string'ini sayıya çevir
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0; // 32bit integer
    }
    
    // Basit bir Pseudo Random Number Generator (PRNG)
    const random = () => {
        var x = Math.sin(hash++) * 10000;
        return x - Math.floor(x);
    };

    // Fisher-Yates Shuffle
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

// Session storage için kullanıcı
const CURRENT_USER_KEY = 'current_user';

// Deadlock (Kilitlenme) durumu için takas hedefi
let swapTarget = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async function() {
    // Mevcut kullanıcı varsa temizle
    sessionStorage.removeItem(CURRENT_USER_KEY);
    
    if (!EVENT_ID) {
        // Hata mesajını ekranda göster
        const container = document.body; // Body'ye direkt yazalım
        if (container) {
             container.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Poppins', sans-serif;">
                    <div style="text-align: center; padding: 40px; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2); max-width: 500px; margin: 20px;">
                        <i class="fa-solid fa-link-slash" style="font-size: 3em; color: #ff6b6b; margin-bottom: 20px;"></i>
                        <h3 style="color: white; margin-bottom: 10px; font-size: 1.5em;">Bağlantı Hatası</h3>
                        <p style="color: rgba(255,255,255,0.8); margin-bottom: 5px;">Bu sayfaya doğrudan erişilemez.</p>
                        <p style="color: rgba(255,255,255,0.8);">Lütfen organizatörün paylaştığı kura linkini kullanın.</p>
                        <a href="admin.html" style="display: inline-block; margin-top: 25px; padding: 12px 30px; background: white; color: #764ba2; text-decoration: none; border-radius: 50px; font-weight: 600; transition: all 0.3s;">Admin Paneline Dön</a>
                    </div>
                </div>
             `;
        }
        return;
    }

    // İlk ekranı göster (İsim Girişi)
    const checkUserSection = document.getElementById('checkUserSection');
    if (checkUserSection) {
        checkUserSection.style.display = 'block';
    }
});

// Yardımcı Fonksiyon: Mesaj Göster
function showMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    // 3 saniye sonra mesajı gizle
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// Kullanıcı kontrolü (İlk Adım)
async function checkUser() {
    const username = document.getElementById('checkUsername').value.trim();
    const messageEl = document.getElementById('checkMessage');

    if (!username) {
        showMessage(messageEl, 'Lütfen adınızı girin!', 'error');
        return;
    }

    const user = await findParticipantByName(username, EVENT_ID);

    if (!user) {
        showMessage(messageEl, 'Bu kura listesinde bulunamadınız!', 'error');
        return;
    }

    // Kullanıcıyı session'a kaydet
    sessionStorage.setItem(CURRENT_USER_KEY, user.name);

    // Kullanıcı daha önce kura çekmiş mi kontrol et
    const existingDraw = await findDrawByUser(user.name, EVENT_ID);

    if (existingDraw) {
        // Zaten çekmiş -> Giriş yapıp sonucunu görsün
        document.getElementById('checkUserSection').style.display = 'none';
        document.getElementById('returningUser').textContent = user.name;
        document.getElementById('loginSection').style.display = 'block';
        return;
    }

    // Kullanıcının şifresi var mı?
    if (!user.password) {
        // İlk giriş - şifre oluşturma
        document.getElementById('checkUserSection').style.display = 'none';
        document.getElementById('newUser').textContent = user.name;
        document.getElementById('createPasswordSection').style.display = 'block';
    } else {
        // Şifresi var ama kura çekmemiş - şifre kontrolü
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
    const user = await findParticipantByName(currentUser, EVENT_ID);
    
    if (user) {
        const success = await updateParticipant(user.id, { password: password }, EVENT_ID);
        
        if (success) {
            showMessage(messageEl, 'Şifre oluşturuldu! Yönlendiriliyorsunuz...', 'success');
            
            // Kura tahtasına yönlendir
            setTimeout(() => {
                document.getElementById('createPasswordSection').style.display = 'none';
                showDrawBoard();
            }, 1000);
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

    const user = await findParticipantByName(currentUser, EVENT_ID);

    if (!user || user.password !== password) {
        showMessage(messageEl, 'Şifre hatalı!', 'error');
        return;
    }

    // Kullanıcı zaten kura çekmiş mi?
    const existingDraw = await findDrawByUser(user.name, EVENT_ID);

    if (existingDraw) {
        // Sonuçları göster
        showResult(existingDraw);
    } else {
        // Kura tahtasına yönlendir
        showMessage(messageEl, 'Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
            document.getElementById('loginSection').style.display = 'none';
            showDrawBoard();
        }, 1000);
    }
}

// Kura Tahtasını Göster (Ana Mantık)
async function showDrawBoard() {
    const currentUser = sessionStorage.getItem(CURRENT_USER_KEY);
    document.getElementById('boardUser').textContent = currentUser;
    document.getElementById('drawBoardSection').style.display = 'block';
    
    const container = document.getElementById('drawBoardButtons');
    container.innerHTML = '<div style="text-align: center; color: white;">Yükleniyor...</div>';

    try {
        // Katılımcıları getir
        let participants = await getParticipants(EVENT_ID);
        
        // Rastgele sıralama (Ancak herkes için aynı olmalı)
        // Event ID'yi seed olarak kullanarak karıştırıyoruz
        // Basit bir hash fonksiyonu ile tutarlı bir karıştırma yapalım
        participants = seededShuffle(participants, EVENT_ID);
        
        const draws = await getDraws(EVENT_ID);
        
        // Benim indexim
        const myIndex = participants.findIndex(p => p.name === currentUser);
        document.getElementById('myNumberDisplay').textContent = myIndex + 1;

        // Alınmış (Recipient olarak seçilmiş) kişilerin indexleri
        // draws: [{ user: "Ali", recipient: "Veli", ... }]
        // Veli'nin indexini bulmalıyız.
        const takenIndices = [];
        draws.forEach(d => {
            const idx = participants.findIndex(p => p.name === d.recipient);
            if (idx !== -1) takenIndices.push(idx);
        });

        container.innerHTML = '';
        let availableCount = 0;

        // Butonları oluştur
        for (let i = 0; i < participants.length; i++) {
            const btnIndex = i; // 0-based index
            const btnNumber = i + 1; // 1-based display
            const button = document.createElement('button');
            button.className = 'number-btn';
            button.textContent = btnNumber;
            
            let isSelf = (btnIndex === myIndex);
            let isTaken = takenIndices.includes(btnIndex);
            
            if (isSelf) {
                button.classList.add('disabled');
                button.style.backgroundColor = '#95a5a6'; // Gri (Kendisi)
                button.style.cursor = 'not-allowed';
                button.title = "Bu sizin numaranız";
            } else if (isTaken) {
                button.classList.add('disabled');
                button.style.backgroundColor = '#e74c3c'; // Kırmızı (Dolu)
                button.style.cursor = 'not-allowed';
                button.title = "Bu numara zaten seçildi";
            } else {
                // Müsait
                button.onclick = () => selectNumber(btnIndex, participants);
                availableCount++;
            }
            
            container.appendChild(button);
        }

        // Deadlock Kontrolü (Kilitlenme)
        // Eğer müsait buton yoksa ama hala seçim yapması gerekiyorsa (ki buradaysa gerekiyor)
        if (availableCount === 0) {
            console.log("Deadlock detected! Activating swap logic.");
            
            // Rastgele bir kurban seç (Swap Target)
            // draws listesinden rastgele birini seçiyoruz.
            if (draws.length > 0) {
                const randomIndex = Math.floor(Math.random() * draws.length);
                const victimDraw = draws[randomIndex];
                
                // Kurbanın aldığı kişiyi (recipient) bul ve o butonu aç
                const victimRecipientIndex = participants.findIndex(p => p.name === victimDraw.recipient);
                
                if (victimRecipientIndex !== -1) {
                    // Butonu bul ve aktifleştir
                    const buttons = container.getElementsByTagName('button');
                    const targetBtn = buttons[victimRecipientIndex];
                    
                    if (targetBtn) {
                        targetBtn.classList.remove('disabled');
                        targetBtn.style.backgroundColor = ''; // Varsayılan stil
                        targetBtn.style.cursor = 'pointer';
                        targetBtn.onclick = () => selectNumber(victimRecipientIndex, participants);
                        
                        // Swap hedefini kaydet
                        swapTarget = victimDraw;
                        
                        const msgEl = document.getElementById('drawBoardMessage');
                        showMessage(msgEl, 'Sona kaldınız! Sistem sizin için özel bir eşleşme ayarladı. Lütfen açık olan kutuyu seçin.', 'info');
                    }
                }
            } else {
                // Bu durum teorik olarak imkansız (ilk kişi deadlock olamaz)
                console.error("Critical Error: No draws available for swap.");
            }
        }

    } catch (error) {
        console.error("Tahta yüklenemedi:", error);
        container.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5);">Hata oluştu.</div>';
    }
}

// Numara Seçimi ve Onay
function selectNumber(participantIndex, participants) {
    const selectedParticipant = participants[participantIndex];
    const btnNumber = participantIndex + 1;
    
    if (confirm(`${btnNumber} numaralı kutuyu seçmek istediğinize emin misiniz?`)) {
        drawGift(selectedParticipant, btnNumber);
    }
}

// Kura İşlemi (Backend Kayıt)
async function drawGift(recipient, selectedNumber) {
    const currentUser = sessionStorage.getItem(CURRENT_USER_KEY);
    const messageEl = document.getElementById('drawBoardMessage');
    
    // UI Kilitleme
    const buttons = document.querySelectorAll('.number-btn');
    buttons.forEach(b => b.disabled = true);
    
    showMessage(messageEl, 'Seçiminiz kaydediliyor...', 'info');

    try {
        if (swapTarget) {
            // --- SWAP SENARYOSU ---
            // Durum: A -> B. C (Ben) geldim. B'yi seçtim (Swap ile).
            // Hedef: A -> C, C -> B.
            // swapTarget: { id: "...", user: "A", recipient: "B", ... }
            // recipient: B (Benim seçtiğim)
            
            // 1. Benim çekilişimi kaydet (C -> B)
            const myDraw = {
                user: currentUser,
                recipient: recipient.name,
                selectedNumber: selectedNumber,
                timestamp: Date.now()
            };
            await addDraw(myDraw, EVENT_ID);
            
            // 2. Kurbanın çekilişini güncelle (A -> C)
            // Kurbanın (A) yeni alıcısı ben (C) oluyorum.
            // Benim numaramı bulmam lazım ama görsel olarak önemli değil, veritabanında isim tutuyoruz.
            // Ancak selectedNumber tutarlılığı için benim numaramı bulsak iyi olur.
            // Neyse, admin panelinde numara çok kritik değil, isim önemli.
            
            // Kurbanın draw ID'sini bulmamız lazım. `getDraws` ID dönmüyor olabilir, kontrol edelim.
            // `firebase-config.js` içindeki `getDraws` object values dönüyor. ID'ye erişmek için `findDrawByUser` kullanalım ama o da data dönüyor.
            // `addDraw` push yapıyor. Update için key lazım.
            // Basitlik adına: Kurbanın eski kaydını SİLİP yeni kayıt ekleyelim.
            // Veya `updateDraw` fonksiyonu yazmamız lazım. `firebase-config.js`'de yok.
            // `firebase-config.js`'ye dokunmadan:
            // Veritabanı yapısı: events/{id}/draws/{pushId}
            // ID'yi bulmak için query yapmamız lazım.
            
            // Hızlı çözüm: Swap işlemini backend tarafında (firebase-config.js) bir fonksiyonla yapmak en temizi ama dosya değiştirmek istemiyorum.
            // Client-side çözüm:
            // 1. Tüm drawları çek (key ile beraber).
            const dbRef = firebase.database().ref(`events/${EVENT_ID}/draws`);
            const snapshot = await dbRef.once('value');
            const allDraws = snapshot.val() || {};
            
            let victimDrawKey = null;
            for (const [key, val] of Object.entries(allDraws)) {
                if (val.user === swapTarget.user) {
                    victimDrawKey = key;
                    break;
                }
            }
            
            if (victimDrawKey) {
                // Kurbanın alıcısını güncelle
                await dbRef.child(victimDrawKey).update({
                    recipient: currentUser
                    // selectedNumber'ı güncellemiyoruz çünkü o A'nın seçtiği kutuydu. 
                    // A kutu 2'yi seçmişti (içinde B vardı). Şimdi içinde C var. Kutu numarası değişmez.
                });
            }
            
        } else {
            // --- NORMAL SENARYO ---
            const drawData = {
                user: currentUser,
                recipient: recipient.name,
                selectedNumber: selectedNumber,
                timestamp: Date.now()
            };
            
            await addDraw(drawData, EVENT_ID);
        }
        
        // Başarılı -> Sonuç ekranına git
        const resultData = {
            recipient: recipient.name,
            selectedNumber: selectedNumber
        };
        showResult(resultData);

    } catch (error) {
        console.error("Kura kaydedilemedi:", error);
        showMessage(messageEl, 'Bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        buttons.forEach(b => b.disabled = false); // Kilidi aç
    }
}

// Sonuç Ekranını Göster
function showResult(drawData) {
    // Tüm diğer ekranları gizle
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('drawBoardSection').style.display = 'none';
    document.getElementById('checkUserSection').style.display = 'none';
    
    // Sonuç ekranını doldur
    document.getElementById('viewGiftRecipient').textContent = drawData.recipient;
    document.getElementById('viewSelectedNumber').textContent = drawData.selectedNumber;
    document.getElementById('resultContainer').style.display = 'block';
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

// Çıkış yap
function logout() {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    window.location.reload();
}

// Enter tuşu ile form gönderimi
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const checkUserSection = document.getElementById('checkUserSection');
        const createPasswordSection = document.getElementById('createPasswordSection');
        const loginSection = document.getElementById('loginSection');
        
        if (checkUserSection && checkUserSection.style.display !== 'none') {
            checkUser();
        } else if (createPasswordSection && createPasswordSection.style.display !== 'none') {
            createPassword();
        } else if (loginSection && loginSection.style.display !== 'none') {
            login();
        }
    }
});
