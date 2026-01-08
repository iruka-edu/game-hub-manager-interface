// Google Cloud Storage Management
export class GCSManagement {
  private gcsFiles: any[] = [];
  private dbGameIds: Set<string> = new Set();
  private selectedGameIds: Set<string> = new Set();

  constructor() {
    this.initializeHandlers();
  }

  private initializeHandlers() {
    const refreshBtn = document.getElementById('refreshGCSBtn');
    const forceRefreshBtn = document.getElementById('forceRefreshGCSBtn');
    const cleanupBtn = document.getElementById('cleanupGCSBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedGamesBtn');
    const filterSelect = document.getElementById('gcsFilter') as HTMLSelectElement;
    const selectAllCheckbox = document.getElementById('selectAllGCSFiles') as HTMLInputElement;

    refreshBtn?.addEventListener('click', () => this.loadGCSData(false));
    forceRefreshBtn?.addEventListener('click', () => this.loadGCSData(true));
    cleanupBtn?.addEventListener('click', () => this.showCleanupModal());
    deleteSelectedBtn?.addEventListener('click', () => this.showDeleteGameModal());
    filterSelect?.addEventListener('change', () => this.filterFiles());
    selectAllCheckbox?.addEventListener('change', () => this.toggleSelectAll());

    // Load data on initialization
    this.loadGCSData(false);
  }

  private async loadGCSData(forceRefresh: boolean = false) {
    this.showLoading(true);
    
    try {
      // Load GCS files and DB game IDs in parallel
      const gcsUrl = forceRefresh ? '/api/gcs/files?refresh=true' : '/api/gcs/files';
      const [gcsResponse, dbResponse] = await Promise.all([
        fetch(gcsUrl),
        fetch('/api/games/ids')
      ]);

      if (!gcsResponse.ok || !dbResponse.ok) {
        throw new Error('Failed to load data');
      }

      const gcsData = await gcsResponse.json();
      const dbData = await dbResponse.json();

      this.gcsFiles = gcsData.files || [];
      this.dbGameIds = new Set(dbData.gameIds || []);

      // Show cache status
      this.showCacheStatus(gcsData.cached, gcsData.cacheTime || gcsData.loadTime);

      this.updateStats();
      this.renderFilesList();
      this.showContent();
    } catch (error) {
      console.error('Failed to load GCS data:', error);
      this.showError('Không thể tải dữ liệu GCS. Vui lòng thử lại.');
    } finally {
      this.showLoading(false);
    }
  }

  private showCacheStatus(cached: boolean, timestamp: string) {
    const cacheStatus = document.getElementById('cacheStatus');
    const cacheStatusText = document.getElementById('cacheStatusText');
    
    if (!cacheStatus || !cacheStatusText) return;

    if (cached) {
      cacheStatusText.textContent = `Dữ liệu từ cache (${new Date(timestamp).toLocaleTimeString('vi-VN')})`;
      cacheStatus.classList.remove('hidden');
    } else {
      cacheStatusText.textContent = `Dữ liệu mới từ GCS (${new Date(timestamp).toLocaleTimeString('vi-VN')})`;
      cacheStatus.classList.remove('hidden');
      // Hide after 3 seconds
      setTimeout(() => {
        cacheStatus.classList.add('hidden');
      }, 3000);
    }
  }

  private showLoading(show: boolean) {
    const loading = document.getElementById('gcsLoading');
    const stats = document.getElementById('gcsStats');
    const filesList = document.getElementById('gcsFilesList');
    const emptyState = document.getElementById('gcsEmptyState');

    if (show) {
      loading?.classList.remove('hidden');
      stats?.classList.add('hidden');
      filesList?.classList.add('hidden');
      emptyState?.classList.add('hidden');
    } else {
      loading?.classList.add('hidden');
    }
  }

  private showContent() {
    const stats = document.getElementById('gcsStats');
    const filesList = document.getElementById('gcsFilesList');
    const emptyState = document.getElementById('gcsEmptyState');

    if (this.gcsFiles.length > 0) {
      stats?.classList.remove('hidden');
      filesList?.classList.remove('hidden');
      emptyState?.classList.add('hidden');
    } else {
      stats?.classList.add('hidden');
      filesList?.classList.add('hidden');
      emptyState?.classList.remove('hidden');
    }
  }

  private showError(message: string) {
    alert(message);
  }

  private updateStats() {
    const totalFiles = this.gcsFiles.length;
    const validFiles = this.gcsFiles.filter(file => this.isValidFile(file)).length;
    const orphanedFiles = totalFiles - validFiles;

    const totalElement = document.getElementById('totalGCSFiles');
    const validElement = document.getElementById('validGCSFiles');
    const orphanedElement = document.getElementById('orphanedGCSFiles');

    if (totalElement) totalElement.textContent = totalFiles.toString();
    if (validElement) validElement.textContent = validFiles.toString();
    if (orphanedElement) orphanedElement.textContent = orphanedFiles.toString();
  }

  private isValidFile(file: any): boolean {
    const gameId = this.extractGameIdFromPath(file.name);
    return gameId ? this.dbGameIds.has(gameId) : false;
  }

  private extractGameIdFromPath(filePath: string): string | null {
    const match = filePath.match(/^games\/([^\/]+)\//);
    return match ? match[1] : null;
  }

  private renderFilesList() {
    const tbody = document.getElementById('gcsFilesTableBody');
    if (!tbody) return;

    const filteredFiles = this.getFilteredFiles();
    
    if (filteredFiles.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-4 py-8 text-center text-slate-500">
            Không có file nào phù hợp với bộ lọc
          </td>
        </tr>
      `;
      return;
    }

    // Group files by game ID
    const gameGroups = new Map<string, any[]>();
    filteredFiles.forEach(file => {
      const gameId = this.extractGameIdFromPath(file.name);
      if (gameId) {
        if (!gameGroups.has(gameId)) {
          gameGroups.set(gameId, []);
        }
        gameGroups.get(gameId)!.push(file);
      }
    });

    tbody.innerHTML = Array.from(gameGroups.entries()).map(([gameId, files]) => {
      const isValid = this.dbGameIds.has(gameId);
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const latestFile = files.sort((a, b) => new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime())[0];
      const isSelected = this.selectedGameIds.has(gameId);

      return `
        <tr class="hover:bg-slate-50 ${isSelected ? 'bg-blue-50' : ''}">
          <td class="px-4 py-3">
            <input 
              type="checkbox" 
              class="game-file-checkbox rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              data-game-id="${gameId}"
              ${isSelected ? 'checked' : ''}
            />
          </td>
          <td class="px-4 py-3 text-sm font-mono text-slate-900">${gameId}</td>
          <td class="px-4 py-3 text-sm text-slate-600">
            <div class="max-w-xs truncate" title="${files.map(f => f.name).join('\n')}">
              ${files.length} file(s) - ${files[0].name.split('/').slice(0, 3).join('/')}...
            </div>
          </td>
          <td class="px-4 py-3 text-sm text-slate-600">${this.formatFileSize(totalSize)}</td>
          <td class="px-4 py-3 text-sm text-slate-600">${new Date(latestFile.timeCreated).toLocaleDateString('vi-VN')}</td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isValid 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }">
              ${isValid ? 'Hợp lệ' : 'Thừa'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    this.attachCheckboxListeners();
  }

  private attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.game-file-checkbox') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const gameId = checkbox.dataset.gameId;
        if (!gameId) return;

        if (checkbox.checked) {
          this.selectedGameIds.add(gameId);
        } else {
          this.selectedGameIds.delete(gameId);
        }

        this.updateSelectAllState();
        this.updateDeleteButtonState();
      });
    });
  }

  private toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllGCSFiles') as HTMLInputElement;
    const checkboxes = document.querySelectorAll('.game-file-checkbox') as NodeListOf<HTMLInputElement>;

    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAllCheckbox.checked;
      const gameId = checkbox.dataset.gameId;
      if (gameId) {
        if (selectAllCheckbox.checked) {
          this.selectedGameIds.add(gameId);
        } else {
          this.selectedGameIds.delete(gameId);
        }
      }
    });

    this.updateDeleteButtonState();
  }

  private updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('selectAllGCSFiles') as HTMLInputElement;
    const checkboxes = document.querySelectorAll('.game-file-checkbox') as NodeListOf<HTMLInputElement>;
    
    if (!selectAllCheckbox || checkboxes.length === 0) return;

    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalCount = checkboxes.length;

    selectAllCheckbox.checked = checkedCount === totalCount;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCount;
  }

  private updateDeleteButtonState() {
    const deleteBtn = document.getElementById('deleteSelectedGamesBtn') as HTMLButtonElement;
    if (deleteBtn) {
      deleteBtn.disabled = this.selectedGameIds.size === 0;
      deleteBtn.textContent = this.selectedGameIds.size > 0 
        ? `Xóa ${this.selectedGameIds.size} game đã chọn`
        : 'Xóa game đã chọn';
    }
  }

  private getFilteredFiles(): any[] {
    const filterSelect = document.getElementById('gcsFilter') as HTMLSelectElement;
    const filter = filterSelect?.value || 'all';

    switch (filter) {
      case 'valid':
        return this.gcsFiles.filter(file => this.isValidFile(file));
      case 'orphaned':
        return this.gcsFiles.filter(file => !this.isValidFile(file));
      default:
        return this.gcsFiles;
    }
  }

  private filterFiles() {
    this.renderFilesList();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private showDeleteGameModal() {
    const selectedGames = Array.from(this.selectedGameIds);
    
    if (selectedGames.length === 0) {
      alert('Vui lòng chọn ít nhất một game để xóa.');
      return;
    }

    const modal = document.getElementById('deleteGameModal');
    const countSpan = document.getElementById('deleteGameCount');
    const gamesList = document.getElementById('deleteGamesList');

    if (!modal || !countSpan || !gamesList) return;

    countSpan.textContent = selectedGames.length.toString();

    gamesList.innerHTML = selectedGames.map(gameId => {
      const isValid = this.dbGameIds.has(gameId);
      return `
        <div class="text-sm py-1 flex items-center justify-between">
          <span class="font-mono text-slate-900">${gameId}</span>
          <span class="text-xs px-2 py-1 rounded ${
            isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }">
            ${isValid ? 'Có trong DB' : 'Không có trong DB'}
          </span>
        </div>
      `;
    }).join('');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    this.setupDeleteGameModalHandlers(selectedGames);
  }

  private setupDeleteGameModalHandlers(selectedGames: string[]) {
    const modal = document.getElementById('deleteGameModal');
    const cancelBtn = document.getElementById('cancelDeleteGame');
    const confirmBtn = document.getElementById('confirmDeleteGame');

    const closeModal = () => {
      modal?.classList.add('hidden');
      modal?.classList.remove('flex');
    };

    const newCancelBtn = cancelBtn?.cloneNode(true);
    const newConfirmBtn = confirmBtn?.cloneNode(true);
    
    if (cancelBtn && newCancelBtn) {
      cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
      newCancelBtn.addEventListener('click', closeModal);
    }

    if (confirmBtn && newConfirmBtn) {
      confirmBtn.parentNode?.replaceChild(newConfirmBtn, confirmBtn);
      newConfirmBtn.addEventListener('click', async () => {
        await this.executeDeleteGames(selectedGames);
        closeModal();
      });
    }
  }

  private async executeDeleteGames(gameIds: string[]) {
    const confirmBtn = document.getElementById('confirmDeleteGame') as HTMLButtonElement;
    
    if (!confirmBtn) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Đang xóa...';

    try {
      const response = await fetch('/api/gcs/delete-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameIds,
          keepInDatabase: true
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }

      const result = await response.json();
      
      alert(`Đã xóa thành công ${result.totalFilesDeleted} file của ${result.gamesProcessed} game(s).`);
      
      this.selectedGameIds.clear();
      await this.loadGCSData(true);
    } catch (error) {
      console.error('Delete games failed:', error);
      alert('Có lỗi xảy ra khi xóa games: ' + (error as Error).message);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Xác nhận xóa';
    }
  }

  private showCleanupModal() {
    const orphanedFiles = this.gcsFiles.filter(file => !this.isValidFile(file));
    
    if (orphanedFiles.length === 0) {
      alert('Không có file thừa nào cần xóa.');
      return;
    }

    const modal = document.getElementById('cleanupGCSModal');
    const countSpan = document.getElementById('cleanupCount');
    const filesList = document.getElementById('cleanupFilesList');

    if (!modal || !countSpan || !filesList) return;

    countSpan.textContent = orphanedFiles.length.toString();

    filesList.innerHTML = orphanedFiles.map(file => {
      const gameId = this.extractGameIdFromPath(file.name);
      return `
        <div class="text-sm text-slate-600 py-1">
          <span class="font-mono text-red-600">${gameId || 'N/A'}</span>
          <span class="text-slate-400 ml-2">${file.name}</span>
        </div>
      `;
    }).join('');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    this.setupCleanupModalHandlers(orphanedFiles);
  }

  private setupCleanupModalHandlers(orphanedFiles: any[]) {
    const modal = document.getElementById('cleanupGCSModal');
    const cancelBtn = document.getElementById('cancelCleanup');
    const confirmBtn = document.getElementById('confirmCleanup');

    const closeModal = () => {
      modal?.classList.add('hidden');
      modal?.classList.remove('flex');
    };

    const newCancelBtn = cancelBtn?.cloneNode(true);
    const newConfirmBtn = confirmBtn?.cloneNode(true);
    
    if (cancelBtn && newCancelBtn) {
      cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
      newCancelBtn.addEventListener('click', closeModal);
    }

    if (confirmBtn && newConfirmBtn) {
      confirmBtn.parentNode?.replaceChild(newConfirmBtn, confirmBtn);
      newConfirmBtn.addEventListener('click', async () => {
        await this.executeCleanup(orphanedFiles);
        closeModal();
      });
    }
  }

  private async executeCleanup(orphanedFiles: any[]) {
    const confirmBtn = document.getElementById('confirmCleanup') as HTMLButtonElement;
    
    if (!confirmBtn) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Đang xóa...';

    try {
      const response = await fetch('/api/gcs/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filesToDelete: orphanedFiles.map(f => f.name),
          validGameIds: Array.from(this.dbGameIds),
          operation: 'cleanup'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Cleanup failed');
      }

      const result = await response.json();
      
      alert(`Đã xóa thành công ${result.deletedCount} file thừa.`);
      
      await this.loadGCSData(true);
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Có lỗi xảy ra khi dọn dẹp: ' + (error as Error).message);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Xác nhận xóa';
    }
  }
}