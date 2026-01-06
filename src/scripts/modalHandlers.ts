// Modal handlers for Submit QC and Update Code
export class ModalHandlers {
  private currentVersionId = '';
  private currentUpdateVersionId = '';
  private currentUpdateGameId = '';

  constructor() {
    this.initializeSubmitQCModal();
    this.initializeUpdateCodeModal();
  }

  // Submit QC Modal
  private initializeSubmitQCModal() {
    const modal = document.getElementById('submitQcModal');
    const modalTitle = document.getElementById('modalGameTitle');
    const modalVersion = document.getElementById('modalVersion');
    const cancelBtn = document.getElementById('cancelSubmitQc');
    const confirmBtn = document.getElementById('confirmSubmitQc') as HTMLButtonElement;
    const checkboxes = document.querySelectorAll('.qc-checklist');
    const noteInput = document.getElementById('selfQaNote') as HTMLTextAreaElement;

    // Open modal
    document.querySelectorAll('.submit-qc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentVersionId = (btn as HTMLElement).dataset.versionId || '';
        const title = (btn as HTMLElement).dataset.gameTitle || '';
        const version = (btn as HTMLElement).dataset.version || '';
        
        if (modalTitle) modalTitle.textContent = title;
        if (modalVersion) modalVersion.textContent = `v${version}`;
        modal?.classList.remove('hidden');
        modal?.classList.add('flex');
        
        // Reset checkboxes and note
        checkboxes.forEach(cb => (cb as HTMLInputElement).checked = false);
        if (noteInput) noteInput.value = '';
        if (confirmBtn) confirmBtn.disabled = true;
      });
    });

    // Close modal
    cancelBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden');
      modal?.classList.remove('flex');
    });

    // Check all checkboxes
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        const allChecked = Array.from(checkboxes).every(c => (c as HTMLInputElement).checked);
        if (confirmBtn) confirmBtn.disabled = !allChecked;
      });
    });

    // Submit to QC
    confirmBtn?.addEventListener('click', async () => {
      await this.handleSubmitQC(confirmBtn, checkboxes, noteInput);
    });
  }

  private async handleSubmitQC(
    confirmBtn: HTMLButtonElement, 
    checkboxes: NodeListOf<Element>, 
    noteInput: HTMLTextAreaElement
  ) {
    if (!this.currentVersionId) return;
    
    // Build Self-QA checklist
    const selfQAChecklist: Record<string, boolean | string> = {
      testedDevices: false,
      testedAudio: false,
      gameplayComplete: false,
      contentVerified: false,
    };
    
    checkboxes.forEach(cb => {
      const field = (cb as HTMLElement).dataset.field;
      if (field) {
        selfQAChecklist[field] = (cb as HTMLInputElement).checked;
      }
    });
    
    if (noteInput?.value) {
      selfQAChecklist.note = noteInput.value;
    }
    
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Đang gửi...';
    
    try {
      // First, save Self-QA checklist
      const selfQaResponse = await fetch(`/api/games/self-qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: this.currentVersionId, checklist: selfQAChecklist })
      });
      
      if (!selfQaResponse.ok) {
        const data = await selfQaResponse.json();
        throw new Error(data.error || 'Không thể lưu Self-QA');
      }
      
      // Then submit to QC
      const response = await fetch(`/api/games/submit-qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: this.currentVersionId })
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Không thể gửi QC');
      }
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error as Error).message);
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Xác nhận gửi QC';
    }
  }

  // Update Code Modal
  private initializeUpdateCodeModal() {
    const updateModal = document.getElementById('updateCodeModal');
    const updateModalTitle = document.getElementById('updateModalGameTitle');
    const updateModalVersion = document.getElementById('updateModalVersion');
    const cancelUpdateBtn = document.getElementById('cancelUpdateCode');
    const confirmUpdateBtn = document.getElementById('confirmUpdateCode') as HTMLButtonElement;
    const fileInput = document.getElementById('updateCodeFile') as HTMLInputElement;

    // Open update code modal
    document.querySelectorAll('.update-code-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentUpdateVersionId = (btn as HTMLElement).dataset.versionId || '';
        this.currentUpdateGameId = (btn as HTMLElement).dataset.gameId || '';
        const title = (btn as HTMLElement).dataset.gameTitle || '';
        const version = (btn as HTMLElement).dataset.version || '';
        
        if (updateModalTitle) updateModalTitle.textContent = title;
        if (updateModalVersion) updateModalVersion.textContent = `v${version}`;
        updateModal?.classList.remove('hidden');
        updateModal?.classList.add('flex');
        
        // Reset file input
        if (fileInput) fileInput.value = '';
        if (confirmUpdateBtn) confirmUpdateBtn.disabled = true;
      });
    });

    // Close update modal
    cancelUpdateBtn?.addEventListener('click', () => {
      updateModal?.classList.add('hidden');
      updateModal?.classList.remove('flex');
    });

    // Enable confirm button when file is selected
    fileInput?.addEventListener('change', () => {
      if (confirmUpdateBtn) {
        confirmUpdateBtn.disabled = !fileInput.files || fileInput.files.length === 0;
      }
    });

    // Confirm update code
    confirmUpdateBtn?.addEventListener('click', async () => {
      await this.handleUpdateCode(confirmUpdateBtn, fileInput);
    });
  }

  private async handleUpdateCode(confirmUpdateBtn: HTMLButtonElement, fileInput: HTMLInputElement) {
    if (!this.currentUpdateVersionId || !fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    
    // Validate file type
    if (!file.name.endsWith('.zip')) {
      alert('Chỉ chấp nhận file .zip');
      return;
    }
    
    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File quá lớn. Kích thước tối đa: 100MB');
      return;
    }
    
    confirmUpdateBtn.disabled = true;
    confirmUpdateBtn.textContent = 'Đang upload...';
    
    try {
      // Upload file using new endpoint that handles everything
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch(`/api/games/versions/${this.currentUpdateVersionId}/upload-code`, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || 'Upload thất bại');
      }
      
      // Success - reload page
      window.location.reload();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error as Error).message);
      confirmUpdateBtn.disabled = false;
      confirmUpdateBtn.textContent = 'Xác nhận cập nhật';
    }
  }
}