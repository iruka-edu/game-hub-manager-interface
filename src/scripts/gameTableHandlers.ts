// Game table interaction handlers
import { getStatusLabel, getStatusColor } from '../utils/gameStatus';

export class GameTableHandlers {
  private versionHistoryCache = new Map<string, any[]>();
  private selectedGames = new Set<string>();

  constructor() {
    this.initializeHandlers();
  }

  private initializeHandlers() {
    this.initializeVersionToggle();
    this.initializeBulkSelection();
    this.initializeBulkActions();
  }

  // Version history toggle functionality
  private initializeVersionToggle() {
    document.querySelectorAll('.toggle-versions-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const gameId = (btn as HTMLElement).dataset.gameId || '';
        const historyRow = document.querySelector(`.version-history-row[data-game-id="${gameId}"]`);
        const arrow = btn.querySelector('svg');
        
        if (!historyRow) return;
        
        // Toggle visibility
        if (historyRow.classList.contains('hidden')) {
          // Show version history
          historyRow.classList.remove('hidden');
          arrow?.classList.add('rotate-180');
          
          // Load versions if not cached
          if (!this.versionHistoryCache.has(gameId)) {
            try {
              const response = await fetch(`/api/games/${gameId}/versions`);
              if (response.ok) {
                const data = await response.json();
                this.versionHistoryCache.set(gameId, data.versions || []);
              }
            } catch (error) {
              console.error('Failed to load versions:', error);
            }
          }
          
          // Render versions
          this.renderVersionHistory(gameId, historyRow);
        } else {
          // Hide version history
          historyRow.classList.add('hidden');
          arrow?.classList.remove('rotate-180');
        }
      });
    });
  }

  private renderVersionHistory(gameId: string, historyRow: Element) {
    const versions = this.versionHistoryCache.get(gameId) || [];
    const cell = historyRow.querySelector('td');
    if (cell) {
      if (versions.length === 0) {
        cell.innerHTML = '<div class="text-sm text-slate-500 text-center py-2">Không có phiên bản nào</div>';
      } else {
        cell.innerHTML = `
          <div class="space-y-2">
            <p class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Lịch sử phiên bản</p>
            ${versions.map((v: any) => `
              <div class="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-slate-200">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-sm font-medium text-slate-900">v${v.version}</span>
                  <span class="px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(v.status)}">
                    ${getStatusLabel(v.status)}
                  </span>
                  ${v.releaseNote ? `<span class="text-xs text-slate-500">${v.releaseNote}</span>` : ''}
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <span>${new Date(v.createdAt).toLocaleDateString('vi-VN')}</span>
                  ${v.buildSize ? `<span>• ${Math.round(v.buildSize / 1024)} KB</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  }

  // Bulk selection functionality
  private initializeBulkSelection() {
    const selectAllCheckbox = document.getElementById('selectAll') as HTMLInputElement;
    const gameCheckboxes = document.querySelectorAll('.game-checkbox') as NodeListOf<HTMLInputElement>;
    
    if (!selectAllCheckbox) return;

    // Select all functionality
    selectAllCheckbox.addEventListener('change', () => {
      gameCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        this.updateSelectedGames(checkbox);
      });
      this.updateBulkActionsVisibility();
    });

    // Individual checkbox functionality
    gameCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectedGames(checkbox);
        this.updateSelectAllState();
        this.updateBulkActionsVisibility();
      });
    });
  }

  private updateSelectedGames(checkbox: HTMLInputElement) {
    const gameId = checkbox.dataset.gameId;
    if (!gameId) return;

    if (checkbox.checked) {
      this.selectedGames.add(gameId);
    } else {
      this.selectedGames.delete(gameId);
    }
  }

  private updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('selectAll') as HTMLInputElement;
    const gameCheckboxes = document.querySelectorAll('.game-checkbox') as NodeListOf<HTMLInputElement>;
    
    if (!selectAllCheckbox) return;

    const checkedCount = Array.from(gameCheckboxes).filter(cb => cb.checked).length;
    const totalCount = gameCheckboxes.length;

    selectAllCheckbox.checked = checkedCount === totalCount;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCount;
  }

  private updateBulkActionsVisibility() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (!bulkActions || !selectedCount) return;

    const count = this.selectedGames.size;
    selectedCount.textContent = `${count} game được chọn`;

    if (count > 0) {
      bulkActions.classList.remove('opacity-0', 'translate-y-2', 'pointer-events-none');
      bulkActions.classList.add('opacity-100', 'translate-y-0');
    } else {
      bulkActions.classList.add('opacity-0', 'translate-y-2', 'pointer-events-none');
      bulkActions.classList.remove('opacity-100', 'translate-y-0');
    }
  }

  // Bulk actions functionality
  private initializeBulkActions() {
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const clearSelectionBtn = document.getElementById('clearSelection');

    bulkDeleteBtn?.addEventListener('click', () => {
      this.showBulkDeleteModal();
    });

    clearSelectionBtn?.addEventListener('click', () => {
      this.clearAllSelections();
    });
  }

  private clearAllSelections() {
    const gameCheckboxes = document.querySelectorAll('.game-checkbox') as NodeListOf<HTMLInputElement>;
    const selectAllCheckbox = document.getElementById('selectAll') as HTMLInputElement;

    gameCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    }

    this.selectedGames.clear();
    this.updateBulkActionsVisibility();
  }

  private showBulkDeleteModal() {
    const modal = document.getElementById('bulkDeleteModal');
    const countSpan = document.getElementById('bulkDeleteCount');
    const gamesList = document.getElementById('bulkDeleteGamesList');

    if (!modal || !countSpan || !gamesList) return;

    countSpan.textContent = this.selectedGames.size.toString();

    // Populate games list
    const selectedGameElements = Array.from(this.selectedGames).map(gameId => {
      const checkbox = document.querySelector(`[data-game-id="${gameId}"]`) as HTMLInputElement;
      const gameTitle = checkbox?.dataset.gameTitle || gameId;
      return `<div class="text-sm text-slate-600">• ${gameTitle}</div>`;
    }).join('');

    gamesList.innerHTML = selectedGameElements;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Setup modal handlers
    this.setupBulkDeleteModalHandlers();
  }

  private setupBulkDeleteModalHandlers() {
    const modal = document.getElementById('bulkDeleteModal');
    const cancelBtn = document.getElementById('cancelBulkDelete');
    const confirmBtn = document.getElementById('confirmBulkDelete');

    const closeModal = () => {
      modal?.classList.add('hidden');
      modal?.classList.remove('flex');
    };

    cancelBtn?.addEventListener('click', closeModal, { once: true });

    confirmBtn?.addEventListener('click', async () => {
      await this.executeBulkDelete();
      closeModal();
    }, { once: true });
  }

  private async executeBulkDelete() {
    const confirmBtn = document.getElementById('confirmBulkDelete') as HTMLButtonElement;
    
    if (!confirmBtn) return;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Đang xóa...';

    try {
      const gameIds = Array.from(this.selectedGames);
      
      // Delete games in parallel
      const deletePromises = gameIds.map(gameId => 
        fetch(`/api/games/${gameId}`, { method: 'DELETE' })
      );

      const results = await Promise.allSettled(deletePromises);
      
      // Check for failures
      const failures = results.filter(result => result.status === 'rejected');
      
      if (failures.length > 0) {
        console.error('Some deletions failed:', failures);
        alert(`Có lỗi xảy ra khi xóa ${failures.length} game(s). Vui lòng thử lại.`);
      }

      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Có lỗi xảy ra khi xóa games. Vui lòng thử lại.');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Xác nhận xóa';
    }
  }

  // Utility methods - removed since we're using the utility functions from gameStatus.ts
}