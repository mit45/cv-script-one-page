// Admin Panel JavaScript - Firebase Edition

const ADMIN_PASSWORD = 'admin2025'; // Admin şifresi

// Admin girişi
async function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const messageEl = document.getElementById('adminLoginMessage');

    if (password === ADMIN_PASSWORD) {
        document.getElementById('adminLoginSection').style.display = 'none';
        document.getElementById('adminPanelSection').style.display = 'block';
        await loadAdminData();
    } else {
        showMessage(messageEl, 'Hatalı admin şifresi!', 'error');
    }
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

// Katılımcı ekle
async function addParticipantToFirebase() {
    const name = document.getElementById('participantName').value.trim();
    const messageEl = document.getElementById('addMessage');

    if (!name) {
        showMessage(messageEl, 'Lütfen katılımcı adını girin!', 'error');
        return;
    }

    // Aynı isimde katılımcı var mı kontrol et
    const existingParticipant = await findParticipantByName(name);
    if (existingParticipant) {
        showMessage(messageEl, 'Bu isimde bir katılımcı zaten var!', 'error');
        return;
    }

    // Yeni katılımcı ekle (şifresiz)
    const participant = {
        name: name,
        password: null, // Kullanıcı ilk girişte oluşturacak
        createdAt: new Date().toISOString()
    };

    const success = await addParticipant(participant);
    
    if (success) {
        // Formu temizle
        document.getElementById('participantName').value = '';
        showMessage(messageEl, 'Katılımcı başarıyla eklendi! İlk girişte şifre oluşturacak.', 'success');
        await loadAdminData();
    } else {
        showMessage(messageEl, 'Katılımcı eklenirken hata oluştu!', 'error');
    }
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
    const tbody = document.getElementById('drawResults');

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

    document.getElementById('totalParticipants').textContent = participants.length;
    document.getElementById('completedDraws').textContent = draws.length;
    document.getElementById('remainingDraws').textContent = participants.length - draws.length;
    
    // Şifresi olan katılımcılar
    const withPassword = participants.filter(p => p.password).length;
    document.getElementById('withPassword').textContent = withPassword;
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
async function resetAllData() {
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
async function resetDraws() {
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
