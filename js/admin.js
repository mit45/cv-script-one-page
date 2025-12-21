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
    const loginSection = document.getElementById('adminLoginSection');
    const adminPanelSection = document.getElementById('adminPanelSection');
    const userPanelSection = document.getElementById('userPanelSection');

    if (!loginSection || !adminPanelSection || !userPanelSection) return;

    if (user) {
        // Kullanıcı giriş yapmış
        document.body.style.overflowY = 'auto';
        loginSection.style.display = 'none';
        
        // Herkes hem organizatör hem katılımcı olabilir
        // Ancak arayüzde karışıklık olmaması için şimdilik:
        // - Admin Paneli (Organizatör)
        // - Üye Paneli (Katılımcı)
        // ayrımını koruyoruz ama herkes Admin Paneline erişebilir yapıyoruz.
        
        // Şimdilik basitlik adına: Herkes Admin Paneline erişsin ve kendi etkinliklerini yönetsin
        adminPanelSection.style.display = 'block';
        userPanelSection.style.display = 'none'; // Üye panelini gizle, herkes yönetici
        
        loadMyEvents();
    } else {
        // Kullanıcı çıkış yapmış
        document.body.style.overflowY = 'hidden';
        loginSection.style.display = 'block';
        adminPanelSection.style.display = 'none';
        userPanelSection.style.display = 'none';
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
                <button onclick="manageEvent('${event.id}', '${event.name}')" class="btn-primary" style="padding: 8px 15px; font-size: 0.9em;">
                    <i class="fa-solid fa-cog"></i> Yönet
                </button>
                <a href="draw.html?id=${event.id}" target="_blank" class="btn-success" style="padding: 8px 15px; font-size: 0.9em; text-decoration: none; display: inline-block;">
                    <i class="fa-solid fa-play"></i> Kura Sayfası
                </a>
                <button onclick="deleteEventConfirm('${event.id}', '${event.name}')" class="btn-delete">
                    <i class="fa-solid fa-trash"></i> Sil
                </button>
            </div>
        </div>
    `).join('');
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

        // Veritabanına kullanıcıyı ekle (İsteğe bağlı ama önerilir)
        // Not: Kura sistemi 'participants' tablosunu kullanıyor. 
        // Eğer kayıt olan kişi kuraya katılacaksa buraya da ekleyebiliriz.
        // Şimdilik sadece Auth profilini güncelliyoruz.

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

// Normal Üye Verilerini Yükle
async function loadUserData(user) {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userDrawResult = document.getElementById('userDrawResult');
    
    // İsim gösterimi: Varsa displayName, yoksa email'in baş kısmı
    if (userNameDisplay) {
        if (user.displayName) {
            userNameDisplay.textContent = user.displayName;
        } else {
            // Email'den isim türetme (örn: ahmet@gmail.com -> Ahmet)
            const nameFromEmail = user.email.split('@')[0];
            userNameDisplay.textContent = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        }
    }

    // Kura sonucunu kontrol et
    try {
        const draws = await getDraws();
        // Kullanıcının ismiyle eşleşen kura sonucunu bul
        // Not: İsim eşleşmesi hassas olabilir, ileride ID bazlı yapılabilir.
        const myDraw = draws.find(d => d.user === user.displayName);

        if (myDraw) {
            userDrawResult.innerHTML = `
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-top: 10px;">
                    <p style="margin-bottom: 10px; color: rgba(255,255,255,0.8);">Hediye Alacağın Kişi:</p>
                    <h2 style="color: #667eea; font-size: 2em; margin: 0;">${myDraw.recipient}</h2>
                    <p style="margin-top: 15px; font-size: 0.9em; color: rgba(255,255,255,0.6);">
                        <i class="fa-solid fa-calendar"></i> Çekiliş Tarihi: ${new Date(myDraw.date).toLocaleDateString('tr-TR')}
                    </p>
                </div>
            `;
        } else {
            userDrawResult.innerHTML = `
                <div style="padding: 20px; color: rgba(255,255,255,0.6);">
                    <i class="fa-solid fa-hourglass-half" style="font-size: 2em; margin-bottom: 10px; display: block;"></i>
                    <p>Henüz kura çekmediniz veya adınıza bir sonuç bulunamadı.</p>
                    <p style="font-size: 0.8em; margin-top: 10px;">(Kayıt olduğunuz isim ile kura listesindeki ismin birebir aynı olduğundan emin olun)</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Kura sonucu hatası:", error);
        userDrawResult.textContent = "Bilgiler yüklenirken hata oluştu.";
    }
}

// Admin girişi

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
function adminLogout() {
    auth.signOut();
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
                <td colspan="5" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">
                    Henüz katılımcı eklenmemiş
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = participants.map((p, index) => {
        const hasDraw = draws.find(d => d.user === p.name);
        const hasPassword = p.password ? '✓' : '✗';
        const drawStatus = hasDraw ? '✓ Çekti' : '✗ Çekmedi';
        const recipient = hasDraw ? hasDraw.recipient : '-';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${hasPassword}</td>
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
                <td colspan="4" style="text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">
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
                <td>${index + 1}</td>
                <td>${d.user}</td>
                <td>${d.recipient}</td>
                <td>${d.selectedNumber}</td>
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

// Toplu katılımcı ekleme
async function bulkAddParticipants() {
    const textarea = document.getElementById('bulkNames');
    const names = textarea.value.split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

    const messageEl = document.getElementById('bulkMessage');

    if (names.length === 0) {
        showMessage(messageEl, 'Lütfen en az bir isim girin!', 'error');
        return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const name of names) {
        const existingParticipant = await findParticipantByName(name, currentEventId);
        
        if (!existingParticipant) {
            const participant = {
                name: name,
                password: null,
                createdAt: new Date().toISOString()
            };
            
            const success = await addParticipant(participant, currentEventId);
            if (success) {
                addedCount++;
            }
        } else {
            skippedCount++;
        }
    }

    textarea.value = '';
    showMessage(messageEl, 
        `${addedCount} katılımcı eklendi. ${skippedCount > 0 ? skippedCount + ' zaten vardı.' : ''}`, 
        'success'
    );
    
    await loadAdminData();
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

// Admin çıkış
function adminLogout() {
    // Listener'ları kapat
    offParticipantsChange();
    offDrawsChange();
    
    document.getElementById('adminPanelSection').style.display = 'none';
    document.getElementById('adminLoginSection').style.display = 'block';
    document.getElementById('adminPassword').value = '';
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
