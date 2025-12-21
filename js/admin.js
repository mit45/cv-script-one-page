// Admin Panel JavaScript - Firebase Edition

let currentEventId = null; // Seçili etkinlik ID'si

// Oturum durumunu izle
auth.onAuthStateChanged((user) => {
    // DOM'un hazır olduğundan emin olalım
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => handleAuthState(user));
    } else {
        handleAuthState(user);
    }
});

function handleAuthState(user) {
    console.log("handleAuthState called", user);
    const loginSection = document.getElementById('adminLoginSection');
    const adminPanelSection = document.getElementById('adminPanelSection');
    const userPanelSection = document.getElementById('userPanelSection');
    
    // Headers
    const defaultHeader = document.getElementById('defaultHeader');
    const userHeader = document.getElementById('userHeader');

    if (!loginSection || !adminPanelSection || !userPanelSection) {
        console.error("Missing sections in DOM", { loginSection, adminPanelSection, userPanelSection });
        return;
    }

    if (user) {
        console.log("User is logged in, switching views");
        // Kullanıcı giriş yapmış
        document.body.style.overflowY = 'auto';
        loginSection.style.display = 'none';
        
        // Header değişimi
        if (defaultHeader) defaultHeader.style.display = 'none';
        if (userHeader) userHeader.style.display = '';

        // Kullanıcı Yönetimi Butonu Kontrolü
        const userManagementBtn = document.getElementById('userManagementBtn');
        if (userManagementBtn) {
            if (user.email === 'umittopuzg@gmail.com') {
                userManagementBtn.style.display = 'flex';
            } else {
                userManagementBtn.style.display = 'none';
            }
        }
        
        // Şimdilik basitlik adına: Herkes Admin Paneline erişsin ve kendi etkinliklerini yönetsin
        adminPanelSection.style.display = 'block';
        userPanelSection.style.display = 'none'; // Üye panelini gizle, herkes yönetici
        
        // Hoşgeldin mesajını güncelle
        const welcomeMsg = document.getElementById('adminWelcomeMsg');
        if (welcomeMsg) {
            const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı');
            // İlk harfi büyük yap
            const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
            welcomeMsg.textContent = `Hoşgeldiniz, ${formattedName}`;
        }

        loadMyEvents();
    } else {
        console.log("User is logged out, showing login");
        // Kullanıcı çıkış yapmış
        document.body.style.overflowY = 'hidden';
        loginSection.style.display = 'flex';
        adminPanelSection.style.display = 'none';
        userPanelSection.style.display = 'none';
        
        // Header değişimi
        if (defaultHeader) defaultHeader.style.display = ''; // Flex veya block, CSS'e bağlı ama genelde flex
        if (userHeader) userHeader.style.display = 'none';

        // Formu sıfırla
        toggleForms('login');
    }
}

// Etkinlikleri Yükle
async function loadMyEvents() {
    const user = auth.currentUser;
    if (!user) return;

    const eventsListEl = document.getElementById('myEventsList');
    eventsListEl.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5);">Yükleniyor...</div>';

    const events = await getUserEvents(user.uid);

    if (events.length === 0) {
        eventsListEl.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.5);">Henüz bir kura etkinliği oluşturmadınız.</div>';
        return;
    }

    eventsListEl.innerHTML = events.map(event => `
        <div class="admin-box event-card">
            <div class="event-info">
                <h4>${event.name}</h4>
                <small>Oluşturulma: ${new Date(event.createdAt).toLocaleDateString('tr-TR')}</small>
            </div>
            <div class="event-actions">
                <button onclick="manageEvent('${event.id}', '${event.name}')" class="btn-icon btn-primary" title="Yönet">
                    <i class="fa-solid fa-cog"></i>
                </button>
                <a href="draw.html?id=${event.id}" target="_blank" class="btn-icon btn-success" title="Kura Sayfası">
                    <i class="fa-solid fa-play"></i>
                </a>
                <button onclick="shareEventLink('${event.id}')" class="btn-icon btn-info" title="Linki Paylaş">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>
                <button onclick="deleteEventConfirm('${event.id}', '${event.name}')" class="btn-icon btn-delete" title="Sil">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Link Paylaşma
function shareEventLink(eventId) {
    const url = `${window.location.origin}/draw.html?id=${eventId}`;
    const modal = document.getElementById('shareModal');
    const input = document.getElementById('shareLinkInput');
    
    // Set URL to input
    input.value = url;
    
    // Update Social Links
    document.getElementById('shareWhatsapp').href = `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`;
    document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    document.getElementById('shareTwitter').href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=Kura Çekilişine Katıl!`;
    document.getElementById('shareEmail').href = `mailto:?subject=Kura Çekilişi Daveti&body=Merhaba, seni kura çekilişine davet ediyorum: ${url}`;

    // Show Modal
    modal.style.display = 'flex';
}

function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}

function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    input.select();
    input.setSelectionRange(0, 99999); // For mobile devices

    navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.textContent;
        
        btn.textContent = 'Kopyalandı!';
        btn.style.background = '#4CAF50';
        btn.style.color = 'white';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#3ea6ff';
            btn.style.color = 'black';
        }, 2000);
    }).catch(err => {
        console.error('Link kopyalanamadı:', err);
        alert('Link kopyalanamadı. Lütfen manuel kopyalayın.');
    });
}

// Modal dışına tıklayınca kapatma
window.onclick = function(event) {
    const modal = document.getElementById('shareModal');
    if (event.target == modal) {
        closeShareModal();
    }
}

// Etkinlik Silme Onayı
async function deleteEventConfirm(eventId, eventName) {
    if (confirm(`"${eventName}" etkinliğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
        const success = await deleteEvent(eventId);
        if (success) {
            alert('Etkinlik başarıyla silindi.');
            loadMyEvents();
        } else {
            alert('Etkinlik silinirken bir hata oluştu.');
        }
    }
}

// Yeni Etkinlik Oluştur
async function createNewEvent() {
    const nameInput = document.getElementById('newEventName');
    const name = nameInput.value.trim();
    const user = auth.currentUser;

    if (!name) {
        alert('Lütfen bir kura ismi girin!');
        return;
    }

    const eventData = {
        name: name,
        organizerId: user.uid,
        organizerName: user.displayName || user.email,
        participants: {}, // Boş liste
        draws: {},
        stats: { total: 0, drawn: 0 }
    };

    const eventId = await createEvent(eventData);
    
    if (eventId) {
        nameInput.value = '';
        await loadMyEvents();
        // Otomatik olarak yönetmeye başla
        manageEvent(eventId, name);
    } else {
        alert('Etkinlik oluşturulurken bir hata oluştu!');
    }
}

// Etkinliği Yönet
function manageEvent(eventId, eventName) {
    currentEventId = eventId;
    
    // UI Değişikliği
    document.getElementById('eventsListSection').style.display = 'none';
    document.getElementById('eventManagementSection').style.display = 'block';
    document.getElementById('currentEventTitle').textContent = eventName;

    // Verileri Yükle
    loadAdminData();
}

// Listeye Dön
function showEventsList() {
    currentEventId = null;
    document.getElementById('eventsListSection').style.display = 'block';
    document.getElementById('eventManagementSection').style.display = 'none';
    loadMyEvents();
}

// Formlar arası geçiş
function toggleForms(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('formTitle');

    if (formType === 'register') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        title.textContent = 'Kayıt Ol';
    } else {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        title.textContent = 'Çekiliş Uygulamasına Hoşgeldiniz';
    }
}

// Kullanıcı Kaydı
async function registerUser() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const messageEl = document.getElementById('registerMessage');

    if (!name || !email || !password) {
        showMessage(messageEl, 'Lütfen tüm alanları doldurun!', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage(messageEl, 'Şifre en az 6 karakter olmalıdır!', 'error');
        return;
    }

    try {
        // Firebase Auth ile kullanıcı oluştur
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Profil güncelle (İsim ekle)
        await user.updateProfile({
            displayName: name
        });

        // Veritabanına kullanıcıyı ekle
        await database.ref('users/' + user.uid).set({
            name: name,
            email: email,
            createdAt: new Date().toISOString(),
            role: 'user' // Varsayılan rol
        });

        showMessage(messageEl, 'Kayıt başarılı! Yönlendiriliyorsunuz...', 'success');
        // onAuthStateChanged otomatik tetiklenecek
    } catch (error) {
        console.error("Kayıt hatası:", error);
        let errorMessage = 'Kayıt başarısız!';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Bu e-posta adresi zaten kullanımda!';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Geçersiz e-posta adresi!';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Şifre çok zayıf!';
        }
        showMessage(messageEl, errorMessage, 'error');
    }
}



// Admin girişi

// Google ile Giriş
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const messageEl = document.getElementById('adminLoginMessage') || document.getElementById('registerMessage');

    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        showMessage(messageEl, `Hoşgeldin ${user.displayName}! Yönlendiriliyorsunuz...`, 'success');
        
        // Manuel tetikleme
        setTimeout(() => {
            if (auth.currentUser) {
                handleAuthState(auth.currentUser);
            }
        }, 1000);

    } catch (error) {
        console.error("Google giriş hatası:", error);
        let errorMessage = 'Google ile giriş yapılamadı!';
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Giriş penceresi kapatıldı.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'İstek iptal edildi.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Tarayıcı pencereyi engelledi. Lütfen izin verin.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage = 'Google girişi henüz aktif edilmemiş. Lütfen yönetici ile iletişime geçin.';
        }
        
        showMessage(messageEl, errorMessage, 'error');
    }
}

// Admin girişi
async function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const messageEl = document.getElementById('adminLoginMessage');

    if (!email || !password) {
        showMessage(messageEl, 'Lütfen e-posta ve şifre girin!', 'error');
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showMessage(messageEl, 'Giriş başarılı, yönlendiriliyorsunuz...', 'success');

        // Manuel tetikleme (Eğer listener çalışmazsa diye)
        setTimeout(() => {
            if (auth.currentUser) {
                console.log("Manual auth check triggered");
                handleAuthState(auth.currentUser);
            }
        }, 1000);
    } catch (error) {
        console.error("Giriş hatası:", error);
        let errorMessage = 'Giriş başarısız!';
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            errorMessage = 'Hatalı e-posta veya şifre!';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Geçersiz e-posta adresi!';
        }
        showMessage(messageEl, errorMessage, 'error');
    }
}

// Çıkış yap
async function adminLogout() {
    try {
        await auth.signOut();
        // Sayfayı yenile ki cache veya state kalmasın
        window.location.reload();
    } catch (error) {
        console.error("Çıkış hatası:", error);
        alert("Çıkış yapılırken bir hata oluştu.");
    }
}

// Admin verilerini yükle
async function loadAdminData() {
    await updateParticipantsList();
    await updateDrawResults();
    await updateStats();
    
    // Önceki listenerları kapat (varsa)
    offParticipantsChange(currentEventId);
    offDrawsChange(currentEventId);

    // Realtime güncellemeler için listener'ları başlat
    onParticipantsChange(async () => {
        await updateParticipantsList();
        await updateStats();
    }, currentEventId);
    
    onDrawsChange(async () => {
        await updateDrawResults();
        await updateStats();
    }, currentEventId);
}

// Katılımcı ekle (Toplu)
async function addParticipantsToFirebase() {
    const namesText = document.getElementById('participantNames').value;
    const messageEl = document.getElementById('addMessage');

    // Kura çekimi başlamış mı kontrol et
    try {
        const draws = await getDraws(currentEventId);
        if (draws && draws.length > 0) {
            showMessage(messageEl, 'Kura çekimi başladığı için yeni katılımcı eklenemez! Lütfen yeni bir etkinlik oluşturun.', 'error');
            return;
        }
    } catch (error) {
        console.error("Kura durumu kontrol edilemedi:", error);
    }

    if (!namesText || !namesText.trim()) {
        showMessage(messageEl, 'Lütfen en az bir katılımcı adı girin!', 'error');
        return;
    }

    const names = namesText.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    
    if (names.length === 0) {
        showMessage(messageEl, 'Geçerli bir isim bulunamadı!', 'error');
        return;
    }

    let addedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    showMessage(messageEl, 'Katılımcılar ekleniyor...', 'info');

    for (const name of names) {
        // Aynı isimde katılımcı var mı kontrol et
        const existingParticipant = await findParticipantByName(name, currentEventId);
        if (existingParticipant) {
            duplicateCount++;
            continue;
        }

        // Yeni katılımcı ekle (şifresiz)
        const participant = {
            name: name,
            password: null, // Kullanıcı ilk girişte oluşturacak
            createdAt: new Date().toISOString()
        };

        const success = await addParticipant(participant, currentEventId);
        if (success) {
            addedCount++;
        } else {
            errorCount++;
        }
    }
    
    // Sonuç mesajı
    let resultMessage = '';
    let messageType = 'success';

    if (addedCount > 0) {
        resultMessage += `${addedCount} kişi başarıyla eklendi. `;
        document.getElementById('participantNames').value = ''; // Başarılıysa temizle
    }
    
    if (duplicateCount > 0) {
        resultMessage += `${duplicateCount} kişi zaten listede vardı. `;
        messageType = addedCount > 0 ? 'warning' : 'error';
    }

    if (errorCount > 0) {
        resultMessage += `${errorCount} kişi eklenirken hata oluştu.`;
        messageType = 'error';
    }

    showMessage(messageEl, resultMessage, messageType);
    await loadAdminData();
}

// Katılımcı sil
async function deleteParticipantFromDB(participantId) {
    if (!confirm('Bu katılımcıyı silmek istediğinizden emin misiniz?')) {
        return;
    }

    const participants = await getParticipants(currentEventId);
    const participant = participants.find(p => p.id === participantId);
    
    if (participant) {
        // İlgili kura sonuçlarını da sil
        const draws = await getDraws(currentEventId);
        for (const draw of draws) {
            if (draw.user === participant.name || draw.recipient === participant.name) {
                await deleteDraw(draw.id, currentEventId);
            }
        }
    }

    const success = await deleteParticipant(participantId, currentEventId);
    
    if (success) {
        await loadAdminData();
    } else {
        alert('Katılımcı silinirken hata oluştu!');
    }
}

// Katılımcılar listesini güncelle
async function updateParticipantsList() {
    const participants = await getParticipants(currentEventId);
    const draws = await getDraws(currentEventId);
    const tbody = document.getElementById('participantsList');

    if (participants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">
                    Henüz katılımcı eklenmemiş
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = participants.map((p, index) => {
        const hasDraw = draws.find(d => d.user === p.name);
        const drawStatus = hasDraw 
            ? '<i class="fa-solid fa-check" style="color: #4CAF50; font-size: 1.2em;"></i>' 
            : '<i class="fa-solid fa-xmark" style="color: #f44336; font-size: 1.2em;"></i>';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${drawStatus}</td>
                <td>
                    <button onclick="deleteParticipantFromDB('${p.id}')" class="btn-delete" title="Sil">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Kura sonuçlarını güncelle
async function updateDrawResults() {
    const draws = await getDraws(currentEventId);
    const tbody = document.getElementById('drawResultsList');

    if (!tbody) return; // Element yoksa işlem yapma

    if (draws.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">
                    Henüz kura çekilmemiş
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = draws.map((d, index) => {
        const date = new Date(d.date).toLocaleString('tr-TR');
        return `
            <tr>
                <td>${d.user}</td>
                <td>${d.selectedNumber}</td>
                <td>${d.recipient}</td>
            </tr>
        `;
    }).join('');
}

// İstatistikleri güncelle
async function updateStats() {
    const participants = await getParticipants(currentEventId);
    const draws = await getDraws(currentEventId);

    const totalEl = document.getElementById('totalParticipants');
    if (totalEl) totalEl.textContent = participants.length;

    const drawnEl = document.getElementById('drawnParticipants');
    if (drawnEl) drawnEl.textContent = draws.length;

    const remainingEl = document.getElementById('remainingDraws');
    if (remainingEl) remainingEl.textContent = participants.length - draws.length;
    
    // Şifresi olan katılımcılar
    const withPassword = participants.filter(p => p.password).length;
    const passwordEl = document.getElementById('withPassword');
    if (passwordEl) passwordEl.textContent = withPassword;
}



// Tüm verileri sıfırla
async function clearAllData() {
    if (!confirm('TÜM VERİLERİ SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ? Bu işlem geri alınamaz!')) {
        return;
    }

    if (!confirm('Son kez soruyorum: Tüm katılımcılar ve kura sonuçları silinecek. Devam edilsin mi?')) {
        return;
    }

    const success = await clearParticipants(currentEventId);
    
    if (success) {
        alert('Tüm veriler başarıyla silindi!');
        await loadAdminData();
    } else {
        alert('Veriler silinirken hata oluştu!');
    }
}

// Sadece kura sonuçlarını sıfırla
async function resetAllDraws() {
    if (!confirm('Tüm kura sonuçlarını silmek istediğinizden emin misiniz?')) {
        return;
    }

    const success = await clearDraws(currentEventId);
    
    if (success) {
        alert('Kura sonuçları başarıyla silindi!');
        await loadAdminData();
    } else {
        alert('Kura sonuçları silinirken hata oluştu!');
    }
}

// Verileri İndir (Excel/CSV)
async function exportData() {
    try {
        const participants = await getParticipants(currentEventId);
        const draws = await getDraws(currentEventId);
        
        // CSV Başlıkları (Excel'in Türkçe karakterleri tanıması için BOM ekleyeceğiz)
        let csvContent = "\uFEFF"; 
        csvContent += "Sıra;Katılımcı Adı;Şifre Durumu;Kura Durumu;Çektiği Kişi;Çektiği Numara;Kura Tarihi\n";

        participants.forEach((p, index) => {
            const draw = draws.find(d => d.user === p.name);
            
            const sira = index + 1;
            const ad = p.name;
            const sifreDurumu = p.password ? "Var" : "Yok";
            const kuraDurumu = draw ? "Çekti" : "Çekmedi";
            const cektigiKisi = draw ? draw.recipient : "-";
            const cektigiNumara = draw ? draw.selectedNumber : "-";
            const tarih = draw ? new Date(draw.date).toLocaleString('tr-TR') : "-";

            // CSV satırını oluştur (Noktalı virgül ile ayırıyoruz ki Excel sütunları tanısın)
            const row = `${sira};${ad};${sifreDurumu};${kuraDurumu};${cektigiKisi};${cektigiNumara};${tarih}`;
            csvContent += row + "\n";
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `kura_listesi_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Veri indirme hatası:', error);
        alert('Veriler indirilirken bir hata oluştu!');
    }
}



// Enter tuşu ile giriş
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                adminLogin();
            }
        });
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

// --- Profil Yönetimi ---

// Profili Aç
async function openProfile() {
    const user = auth.currentUser;
    if (!user) return;

    // Panelleri yönet
    document.getElementById('adminPanelSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'block';

    // Temel bilgileri doldur
    document.getElementById('profileName').value = user.displayName || '';
    
    // Ek bilgileri veritabanından çek
    try {
        const snapshot = await database.ref('users/' + user.uid).once('value');
        const userData = snapshot.val();
        
        if (userData) {
            if (userData.birthDate) document.getElementById('profileBirthDate').value = userData.birthDate;
            if (userData.profession) document.getElementById('profileProfession').value = userData.profession;
        }
    } catch (error) {
        console.error("Kullanıcı detayları alınamadı:", error);
    }
}

// Profili Kapat
function closeProfile() {
    document.getElementById('profileSection').style.display = 'none';
    document.getElementById('adminPanelSection').style.display = 'block';
    
    // Formu temizle (şifre alanlarını)
    document.getElementById('profileNewPass').value = '';
    document.getElementById('profileConfirmPass').value = '';
    document.getElementById('profileMessage').style.display = 'none';
}

// Profili Kaydet
async function saveUserProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const name = document.getElementById('profileName').value;
    const birthDate = document.getElementById('profileBirthDate').value;
    const profession = document.getElementById('profileProfession').value;
    const newPass = document.getElementById('profileNewPass').value;
    const confirmPass = document.getElementById('profileConfirmPass').value;
    const messageEl = document.getElementById('profileMessage');

    if (!name) {
        showMessage(messageEl, 'Ad Soyad alanı boş bırakılamaz!', 'error');
        return;
    }

    showMessage(messageEl, 'Kaydediliyor...', 'info');

    try {
        // 1. Temel Profil Güncellemesi (Auth)
        if (user.displayName !== name) {
            await user.updateProfile({ displayName: name });
            // Header'daki ismi güncelle
            const welcomeMsg = document.getElementById('adminWelcomeMsg');
            if (welcomeMsg) {
                const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
                welcomeMsg.textContent = `Hoşgeldiniz, ${formattedName}`;
            }
        }

        // 2. Ek Bilgilerin Güncellenmesi (Database)
        await database.ref('users/' + user.uid).update({
            birthDate: birthDate,
            profession: profession,
            updatedAt: new Date().toISOString()
        });

        // 3. Şifre Güncellemesi (Eğer girildiyse)
        if (newPass) {
            if (newPass.length < 6) {
                showMessage(messageEl, 'Yeni şifre en az 6 karakter olmalıdır!', 'error');
                return;
            }
            if (newPass !== confirmPass) {
                showMessage(messageEl, 'Şifreler eşleşmiyor!', 'error');
                return;
            }
            
            await user.updatePassword(newPass);
            showMessage(messageEl, 'Profil ve şifre başarıyla güncellendi!', 'success');
        } else {
            showMessage(messageEl, 'Profil başarıyla güncellendi!', 'success');
        }

        // Kısa bir süre sonra paneli kapat
        setTimeout(() => {
            closeProfile();
        }, 1500);

    } catch (error) {
        console.error("Profil güncelleme hatası:", error);
        let errorMessage = 'Güncelleme sırasında hata oluştu!';
        
        if (error.code === 'auth/requires-recent-login') {
            errorMessage = 'Güvenlik gereği şifre değiştirmek için yeniden giriş yapmalısınız.';
        }
        
        showMessage(messageEl, errorMessage, 'error');
    }
}

// --- Kullanıcı Yönetimi ---

function openUserManagement() {
    const user = auth.currentUser;
    if (!user || user.email !== 'umittopuzg@gmail.com') {
        alert('Bu alana erişim yetkiniz yok.');
        return;
    }

    // Diğer bölümleri gizle
    document.getElementById('adminPanelSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'none';
    
    // Kullanıcı yönetimi bölümünü göster
    const section = document.getElementById('userManagementSection');
    if (section) {
        section.style.display = 'block';
        fetchAllUsers();
    } else {
        console.error("User Management Section not found!");
    }
}

function closeUserManagement() {
    document.getElementById('userManagementSection').style.display = 'none';
    document.getElementById('adminPanelSection').style.display = 'block';
}

async function fetchAllUsers() {
    const listEl = document.getElementById('allUsersList');
    listEl.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>';

    try {
        const snapshot = await database.ref('users').once('value');
        const users = snapshot.val();

        if (!users) {
            listEl.innerHTML = '<tr><td colspan="5" style="text-align:center;">Kayıtlı kullanıcı bulunamadı.</td></tr>';
            return;
        }

        listEl.innerHTML = '';
        Object.entries(users).forEach(([uid, user]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name || 'İsimsiz'}</td>
                <td>${user.email || '-'}</td>
                <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
                <td>${user.role || 'User'}</td>
                <td>
                    <button onclick="viewUserEvents('${uid}', '${user.name}')" class="btn-icon btn-info" title="Etkinlikleri Gör">
                        <i class="fa-solid fa-list"></i>
                    </button>
                    <button onclick="editUser('${uid}', '${user.name}')" class="btn-icon btn-primary" title="Düzenle">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                </td>
            `;
            listEl.appendChild(row);
        });
    } catch (error) {
        console.error("Kullanıcılar getirilemedi:", error);
        listEl.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Hata oluştu!</td></tr>';
    }
}

async function viewUserEvents(userId, userName) {
    const modal = document.getElementById('userEventsModal');
    const listEl = document.getElementById('userEventsList');
    const titleEl = document.getElementById('userEventsTitle');

    titleEl.textContent = `${userName} - Etkinlikleri`;
    listEl.innerHTML = '<div style="text-align:center;">Yükleniyor...</div>';
    modal.style.display = 'flex';

    try {
        const events = await getUserEvents(userId);
        
        if (events.length === 0) {
            listEl.innerHTML = '<div style="text-align:center;">Bu kullanıcının etkinliği yok.</div>';
            return;
        }

        listEl.innerHTML = events.map(event => `
            <div class="admin-box event-card">
                <div class="event-info">
                    <h4>${event.name}</h4>
                    <small>Oluşturulma: ${new Date(event.createdAt).toLocaleDateString('tr-TR')}</small>
                </div>
                <div class="event-actions">
                    <a href="draw.html?id=${event.id}" target="_blank" class="btn-icon btn-success" title="Kura Sayfası">
                        <i class="fa-solid fa-play"></i>
                    </a>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Kullanıcı etkinlikleri alınamadı:", error);
        listEl.innerHTML = '<div style="text-align:center; color:red;">Hata oluştu!</div>';
    }
}

function closeUserEventsModal() {
    document.getElementById('userEventsModal').style.display = 'none';
}

async function editUser(userId, currentName) {
    const newName = prompt("Kullanıcının yeni ismini girin:", currentName);
    if (newName && newName !== currentName) {
        try {
            await database.ref('users/' + userId).update({
                name: newName
            });
            alert("Kullanıcı bilgileri güncellendi.");
            fetchAllUsers(); // Listeyi yenile
        } catch (error) {
            console.error("Güncelleme hatası:", error);
            alert("Güncelleme başarısız!");
        }
    }
}
