// server.js (CodeVault API - Đã Fix Logic Server)

const express = require('express');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;
const DATA_FILE = 'pastes.json';

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(bodyParser.json());

// --- Hàm đọc/ghi file ---
const loadPastes = () => {
    try {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFileSync(DATA_FILE, '[]');
            return [];
        }
        return [];
    }
};

const savePastes = (pastes) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(pastes, null, 2));
};

// Hàm tính thời gian hết hạn (expiresIn tính bằng giây)
const getExpiryTime = (expiresIn) => {
    if (!expiresIn || expiresIn === 'never') return 'never';
    const seconds = parseInt(expiresIn, 10);
    if (isNaN(seconds) || seconds <= 0) return 'never';
    
    return new Date(Date.now() + seconds * 1000).toISOString(); 
};

// --- API ENDPOINT: TẠO PASTE (POST /api/paste) ---
app.post('/api/paste', (req, res) => {
    const { title, content, language, expiresIn, isPrivate } = req.body;

    if (!content) {
        return res.status(400).send({ message: 'Nội dung không được để trống.' });
    }

    const pastes = loadPastes();
    const id = shortid.generate();
    
    // 🛠️ SỬA LỖI LOGIC: Xử lý isPrivate an toàn hơn
    let privacyStatus = true; // Mặc định là true
    if (isPrivate !== undefined) {
        // Chấp nhận boolean (true/false) HOẶC chuỗi ("true"/"false")
        privacyStatus = (isPrivate === true || isPrivate === 'true');
    }
    
    const newPaste = {
        id: id,
        title: title || 'Không tiêu đề',
        content: content,
        language: language || 'text',
        isPrivate: privacyStatus,
        createdAt: new Date().toISOString(),
        expiresAt: getExpiryTime(expiresIn),
        views: 0
    };

    pastes.push(newPaste);
    savePastes(pastes);

    // 🛠️ TỐI ƯU HÓA: Thêm 'return' và loại bỏ link localhost
    return res.status(201).send({ 
        message: 'Paste đã được tạo thành công!',
        id: id,
    });
});

// --- API ENDPOINT: CẬP NHẬT PASTE (PUT /api/paste/:id) ---
app.put('/api/paste/:id', (req, res) => {
    const pasteId = req.params.id;
    const { content } = req.body;

    if (!content) {
        return res.status(400).send({ message: 'Nội dung cập nhật không được để trống.' });
    }

    let pastes = loadPastes();
    const pasteIndex = pastes.findIndex(p => p.id === pasteId);

    if (pasteIndex === -1) {
        return res.status(404).send({ message: 'Không tìm thấy Paste để cập nhật.' });
    }

    // Cập nhật nội dung và thời gian
    pastes[pasteIndex].content = content;
    pastes[pasteIndex].updatedAt = new Date().toISOString(); 

    savePastes(pastes);

    return res.send({ // 🛠️ Thêm return
        message: 'Paste đã được lưu tự động thành công!',
        updatedAt: pastes[pasteIndex].updatedAt
    });
});

// --- API ENDPOINT: LẤY PASTE (GET /api/paste/:id) ---
app.get('/api/paste/:id', (req, res) => {
    const pasteId = req.params.id;
    const pastes = loadPastes();
    const paste = pastes.find(p => p.id === pasteId);

    if (!paste) {
        return res.status(404).send({ message: 'Không tìm thấy Paste.' });
    }
    
    // Kiểm tra hết hạn
    if (paste.expiresAt !== 'never' && new Date(paste.expiresAt) < new Date()) {
        return res.status(410).send({ message: 'Paste này đã hết hạn.' }); 
    }

    // Tăng lượt xem
    if (req.query.action !== 'no-view') {
        paste.views += 1;
        savePastes(pastes);
    }
    
    return res.send(paste); // 🛠️ Thêm return
});

// --- API ENDPOINT: LẤY RAW (GET /api/paste/:id/raw) ---
app.get('/api/paste/:id/raw', (req, res) => {
    const pasteId = req.params.id;
    const pastes = loadPastes();
    const paste = pastes.find(p => p.id === pasteId);

    if (!paste) {
        return res.status(404).send('Không tìm thấy Paste.');
    }
    
    // Kiểm tra hết hạn
    if (paste.expiresAt !== 'never' && new Date(paste.expiresAt) < new Date()) {
        return res.status(410).send('Paste này đã hết hạn.'); 
    }

    res.setHeader('Content-Type', 'text/plain');
    return res.send(paste.content); // 🛠️ Thêm return
});

// --- API ENDPOINT: PASTE GẦN ĐÂY (GET /api/recent?limit=10) ---
app.get('/api/recent', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const pastes = loadPastes();
    
    // Lọc chỉ lấy paste công khai
    const publicPastes = pastes.filter(p => p.isPrivate === false);

    publicPastes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentPastes = publicPastes.slice(0, limit);

    const simplifiedPastes = recentPastes.map(p => ({
        id: p.id,
        title: p.title,
        language: p.language,
        createdAt: p.createdAt,
        views: p.views,
        // Bỏ link localhost
    }));

    return res.send(simplifiedPastes); // 🛠️ Thêm return
});

// --- KHỞI ĐỘNG SERVER ---
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});// server.js (CodeVault API - Đã Fix Logic Server)

const express = require('express');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;
const DATA_FILE = 'pastes.json';

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(bodyParser.json());

// --- Hàm đọc/ghi file ---
const loadPastes = () => {
    try {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    } catch (e) {
        if (e.code === 'ENOENT') {
            fs.writeFileSync(DATA_FILE, '[]');
            return [];
        }
        return [];
    }
};

const savePastes = (pastes) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(pastes, null, 2));
};

// Hàm tính thời gian hết hạn (expiresIn tính bằng giây)
const getExpiryTime = (expiresIn) => {
    if (!expiresIn || expiresIn === 'never') return 'never';
    const seconds = parseInt(expiresIn, 10);
    if (isNaN(seconds) || seconds <= 0) return 'never';
    
    return new Date(Date.now() + seconds * 1000).toISOString(); 
};

// --- API ENDPOINT: TẠO PASTE (POST /api/paste) ---
app.post('/api/paste', (req, res) => {
    const { title, content, language, expiresIn, isPrivate } = req.body;

    if (!content) {
        return res.status(400).send({ message: 'Nội dung không được để trống.' });
    }

    const pastes = loadPastes();
    const id = shortid.generate();
    
    // 🛠️ SỬA LỖI LOGIC: Xử lý isPrivate an toàn hơn
    let privacyStatus = true; // Mặc định là true
    if (isPrivate !== undefined) {
        // Chấp nhận boolean (true/false) HOẶC chuỗi ("true"/"false")
        privacyStatus = (isPrivate === true || isPrivate === 'true');
    }
    
    const newPaste = {
        id: id,
        title: title || 'Không tiêu đề',
        content: content,
        language: language || 'text',
        isPrivate: privacyStatus,
        createdAt: new Date().toISOString(),
        expiresAt: getExpiryTime(expiresIn),
        views: 0
    };

    pastes.push(newPaste);
    savePastes(pastes);

    // 🛠️ TỐI ƯU HÓA: Thêm 'return' và loại bỏ link localhost
    return res.status(201).send({ 
        message: 'Paste đã được tạo thành công!',
        id: id,
    });
});

// --- API ENDPOINT: CẬP NHẬT PASTE (PUT /api/paste/:id) ---
app.put('/api/paste/:id', (req, res) => {
    const pasteId = req.params.id;
    const { content } = req.body;

    if (!content) {
        return res.status(400).send({ message: 'Nội dung cập nhật không được để trống.' });
    }

    let pastes = loadPastes();
    const pasteIndex = pastes.findIndex(p => p.id === pasteId);

    if (pasteIndex === -1) {
        return res.status(404).send({ message: 'Không tìm thấy Paste để cập nhật.' });
    }

    // Cập nhật nội dung và thời gian
    pastes[pasteIndex].content = content;
    pastes[pasteIndex].updatedAt = new Date().toISOString(); 

    savePastes(pastes);

    return res.send({ // 🛠️ Thêm return
        message: 'Paste đã được lưu tự động thành công!',
        updatedAt: pastes[pasteIndex].updatedAt
    });
});

// --- API ENDPOINT: LẤY PASTE (GET /api/paste/:id) ---
app.get('/api/paste/:id', (req, res) => {
    const pasteId = req.params.id;
    const pastes = loadPastes();
    const paste = pastes.find(p => p.id === pasteId);

    if (!paste) {
        return res.status(404).send({ message: 'Không tìm thấy Paste.' });
    }
    
    // Kiểm tra hết hạn
    if (paste.expiresAt !== 'never' && new Date(paste.expiresAt) < new Date()) {
        return res.status(410).send({ message: 'Paste này đã hết hạn.' }); 
    }

    // Tăng lượt xem
    if (req.query.action !== 'no-view') {
        paste.views += 1;
        savePastes(pastes);
    }
    
    return res.send(paste); // 🛠️ Thêm return
});

// --- API ENDPOINT: LẤY RAW (GET /api/paste/:id/raw) ---
app.get('/api/paste/:id/raw', (req, res) => {
    const pasteId = req.params.id;
    const pastes = loadPastes();
    const paste = pastes.find(p => p.id === pasteId);

    if (!paste) {
        return res.status(404).send('Không tìm thấy Paste.');
    }
    
    // Kiểm tra hết hạn
    if (paste.expiresAt !== 'never' && new Date(paste.expiresAt) < new Date()) {
        return res.status(410).send('Paste này đã hết hạn.'); 
    }

    res.setHeader('Content-Type', 'text/plain');
    return res.send(paste.content); // 🛠️ Thêm return
});

// --- API ENDPOINT: PASTE GẦN ĐÂY (GET /api/recent?limit=10) ---
app.get('/api/recent', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const pastes = loadPastes();
    
    // Lọc chỉ lấy paste công khai
    const publicPastes = pastes.filter(p => p.isPrivate === false);

    publicPastes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentPastes = publicPastes.slice(0, limit);

    const simplifiedPastes = recentPastes.map(p => ({
        id: p.id,
        title: p.title,
        language: p.language,
        createdAt: p.createdAt,
        views: p.views,
        // Bỏ link localhost
    }));

    return res.send(simplifiedPastes); // 🛠️ Thêm return
});

// --- KHỞI ĐỘNG SERVER ---
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
