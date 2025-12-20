// Admin Panel JavaScript

const ADMIN_PASSWORD = 'admin2025'; // Admin şifresi

// Admin girişi
function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const messageEl = document.getElementById('adminLoginMessage');

    if (password === ADMIN_PASSWORD) {
        document.getElementById('adminLoginSection').style.display = 'none';
        document.getElementById('adminPanelSection').style.display = 'block';
        loadAdminData();
    } else {
        showMessage(messageEl, 'Hatalı admin şifresi!', 'error');
    }
}

// Admin verilerini yükle
function loadAdminData() {
    updateParticipantsList();
    updateDrawResults();
    updateStats();
}

// Katılımcı ekle
function addParticipant() {
    const name = document.getElementById('participantName').value.trim();
    const messageEl = document.getElementById('addMessage');

    if (!name) {
        showMessage(messageEl, 'Lütfen katılımcı adını girin!', 'error');
        return;
    }

    const participants = getParticipants();

    // Aynı isimde katılımcı var mı kontrol et
    if (participants.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        showMessage(messageEl, 'Bu isimde bir katılımcı zaten var!', 'error');
        return;
    }

    // Yeni katılımcı ekle (şifresiz)
    participants.push({
        id: Date.now(),
        name: name,
        password: null, // Kullanıcı ilk girişte oluşturacak
        createdAt: new Date().toISOString()
    });

    saveParticipants(participants);
    
    // Formu temizle
    document.getElementById('participantName').value = '';
    
    showMessage(messageEl, 'Katılımcı başarıyla eklendi! İlk girişte şifre oluşturacak.', 'success');
    loadAdminData();
}

// Katılımcı sil
function deleteParticipant(participantId) {
    if (!confirm('Bu katılımcıyı silmek istediğinizden emin misiniz?')) {
        return;
    }

    let participants = getParticipants();
    const participant = participants.find(p => p.id === participantId);
    
    if (participant) {
        // İlgili kura sonuçlarını da sil
        let draws = getDraws();
        draws = draws.filter(d => d.userName !== participant.name && d.recipient !== participant.name);
        localStorage.setItem(STORAGE_KEYS.DRAWS, JSON.stringify(draws));
    }

    participants = participants.filter(p => p.id !== participantId);
    saveParticipants(participants);
    
    loadAdminData();
}

// Katılımcılar listesini güncelle
function updateParticipantsList() {
    const participants = getParticipants();
    const draws = getDraws();
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
        const hasDrawn = draws.find(d => d.userName === p.name);
        const drawStatusClass = hasDrawn ? 'completed' : 'pending';
        const drawStatusText = hasDrawn ? 'Çekti' : 'Bekliyor';
        
        const hasPassword = p.password !== null && p.password !== undefined;
        const passwordStatusClass = hasPassword ? 'completed' : 'pending';
        const passwordStatusText = hasPassword ? 'Oluşturuldu' : 'Bekliyor';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>
                    <span class="status-badge ${passwordStatusClass}">${passwordStatusText}</span>
                </td>
                <td>
                    <span class="status-badge ${drawStatusClass}">${drawStatusText}</span>
                </td>
                <td>
                    <button class="btn-delete" onclick="deleteParticipant(${p.id})">
                        <i class="fa-solid fa-trash"></i> Sil
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Kura sonuçlarını güncelle
function updateDrawResults() {
    const draws = getDraws();
    const tbody = document.getElementById('drawResultsList');

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

    tbody.innerHTML = draws.map(d => `
        <tr>
            <td>${d.userName}</td>
            <td>${d.selectedNumber}</td>
            <td>${d.recipient}</td>
        </tr>
    `).join('');
}

// İstatistikleri güncelle
function updateStats() {
    const participants = getParticipants();
    const draws = getDraws();

    document.getElementById('totalParticipants').textContent = participants.length;
    document.getElementById('drawnParticipants').textContent = draws.length;
}

// Tüm kuraları sıfırla
function resetAllDraws() {
    if (!confirm('Tüm kura sonuçlarını sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
        return;
    }

    localStorage.setItem(STORAGE_KEYS.DRAWS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    
    alert('Tüm kura sonuçları sıfırlandı!');
    loadAdminData();
}

// Tüm verileri sil
function clearAllData() {
    if (!confirm('TÜM VERİLERİ SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem:\n- Tüm katılımcıları\n- Tüm kura sonuçlarını\n\nkalıcı olarak silecektir ve GERİ ALINAMAZ!')) {
        return;
    }

    const secondConfirm = prompt('Onaylamak için "SIL" yazın:');
    if (secondConfirm !== 'SIL') {
        alert('İşlem iptal edildi.');
        return;
    }

    localStorage.removeItem(STORAGE_KEYS.PARTICIPANTS);
    localStorage.removeItem(STORAGE_KEYS.DRAWS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    
    alert('Tüm veriler silindi!');
    loadAdminData();
}

// Verileri indir (JSON formatında)
function exportData() {
    const data = {
        participants: getParticipants(),
        draws: getDraws(),
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kura-verileri-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    alert('Veriler başarıyla indirildi!');
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Admin panelindeyse Enter tuşu ile giriş
    if (document.getElementById('adminPassword')) {
        document.getElementById('adminPassword').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                adminLogin();
            }
        });
    }

    // Admin panel açıksa verileri yükle
    if (document.getElementById('adminPanelSection')) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('autologin') === 'true') {
            // Otomatik giriş (geliştirme amaçlı)
            document.getElementById('adminLoginSection').style.display = 'none';
            document.getElementById('adminPanelSection').style.display = 'block';
            loadAdminData();
        }
    }
});
