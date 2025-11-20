// script.js
document.addEventListener('DOMContentLoaded', () => {
    const noteTitleInput = document.getElementById('noteTitle');
    const noteContentTextarea = document.getElementById('noteContent');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    
    saveNoteBtn.addEventListener('click', async () => {
        const title = noteTitleInput.value.trim();
        const content = noteContentTextarea.value.trim();
        const language = document.getElementById('syntaxHighlight').value;
        const expiresIn = document.getElementById('expiryTime').value;
        const isPrivate = document.getElementById('privatePaste').checked; // Gửi rõ ràng status privacy

        if (content === '') {
            alert('Nội dung không được để trống!');
            return;
        }

        const pasteData = {
            title,
            content,
            language,
            expiresIn,
            isPrivate
        };

        try {
            const response = await fetch('https://api-note-dangdanh-nffu.onrender.com/api/paste', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pasteData)
            });

            const result = await response.json();

            if (response.ok) {
                // Chuyển hướng đến trang xem/thông báo
                window.location.href = `view.html?id=${result.id}&status=success`;
            } else {
                alert(`Lỗi: ${result.message}`);
            }

        } catch (error) {
            console.error('Lỗi khi gửi dữ liệu:', error);
            alert('Không thể kết nối đến máy chủ. Đảm bảo server Node.js đang chạy tại cổng 3000.');
        }
    });
});
