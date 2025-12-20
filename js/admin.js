// Admin Panel JavaScript - Firebase Edition

// Oturum durumunu izle
auth.onAuthStateChanged((user) => {
    if (user) {
        // Kullanıcı giriş yapmış
        document.getElementById('adminLoginSection').style.display = 'none';
        document.getElementById('adminPanelSection').style.display = 'block';
        loadAdminData();
    } else {
        // Kullanıcı çıkış yapmış
        document.getElementById('adminLoginSection').style.display = 'block';
        document.getElementById('adminPanelSection').style.display = 'none';
    }
});

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
    
    // Realtime güncellemeler için listener'ları başlat
    onParticipantsChange(async () => {
        await updateParticipantsList();
        await updateStats();
    });
    
    onDrawsChange(async () => {
        await updateDrawResults();
        await updateStats();
    });
}

// Katılımcı ekle (Toplu)
async function addParticipantsToFirebase() {
    const namesText = document.getElementById('participantNames').value;
    const messageEl = document.getElementById('addMessage');

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
        const existingParticipant = await findParticipantByName(name);
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

        const success = await addParticipant(participant);
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

    const participants = await getParticipants();
    const participant = participants.find(p => p.id === participantId);
    
    if (participant) {
        // İlgili kura sonuçlarını da sil
        const draws = await getDraws();
        for (const draw of draws) {
            if (draw.userName === participant.name || draw.recipient === participant.name) {
                await database.ref('draws/' + draw.id).remove();
            }
        }
    }

    const success = await deleteParticipant(participantId);
    
    if (success) {
        await loadAdminData();
    } else {
        alert('Katılımcı silinirken hata oluştu!');
    }
}

// Katılımcılar listesini güncelle
async function updateParticipantsList() {
    const participants = await getParticipants();
    const draws = await getDraws();
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
        const hasDraw = draws.find(d => d.userName === p.name);
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
    const draws = await getDraws();
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
                <td>${d.userName}</td>
                <td>${d.recipient}</td>
                <td>${d.selectedNumber}</td>
            </tr>
        `;
    }).join('');
}

// İstatistikleri güncelle
async function updateStats() {
    const participants = await getParticipants();
    const draws = await getDraws();

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
        const existingParticipant = await findParticipantByName(name);
        
        if (!existingParticipant) {
            const participant = {
                name: name,
                password: null,
                createdAt: new Date().toISOString()
            };
            
            const success = await addParticipant(participant);
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

    const success = await clearParticipants();
    
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

    const success = await clearDraws();
    
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
        const participants = await getParticipants();
        const draws = await getDraws();
        
        // CSV Başlıkları (Excel'in Türkçe karakterleri tanıması için BOM ekleyeceğiz)
        let csvContent = "\uFEFF"; 
        csvContent += "Sıra;Katılımcı Adı;Şifre Durumu;Kura Durumu;Çektiği Kişi;Çektiği Numara;Kura Tarihi\n";

        participants.forEach((p, index) => {
            const draw = draws.find(d => d.userName === p.name);
            
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
