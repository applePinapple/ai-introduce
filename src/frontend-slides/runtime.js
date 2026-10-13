/* === FRONTEND SLIDES: FIXED-STAGE SAMPLE CONTROLLER === */
(() => {
  'use strict';
  class SamplePresentation {
    constructor() {
      this.stage = document.querySelector('.deck-stage');
      this.slides = [...document.querySelectorAll('.deck-stage > .slide')];
      if (!this.stage || !this.slides.length) return;
      this.currentSlide = 0;
      this.editing = false;
      this.wheelTotal = 0;
      this.lastWheelMove = 0;
      this.touchStart = null;
      const sourceSha = document.querySelector('meta[name="source-sha256"]')?.content || document.documentElement.dataset.sourceSha256 || location.pathname;
      this.storageKey = `frontend-slides:blue-professional:${sourceSha}:sample-edits-v1`;
      this.makeControls();
      this.restoreEdits();
      this.bindControls();
      this.setupKeyboard();
      this.setupWheelAndTouch();
      this.setupEditing();
      this.scaleStage();
      window.addEventListener('resize', () => this.scaleStage());
      const initialOriginal = Number((location.hash.match(/slide-(\d+)/) || [])[1] || document.body.dataset.startOriginalSlide || 1);
      const initialIndex = this.slides.findIndex(slide => Number(slide.dataset.originalSlide) === initialOriginal);
      this.showSlide(initialIndex >= 0 ? initialIndex : 0, false);
      document.fonts?.ready.then(() => this.scaleStage());
    }

    /* === UI LIVES OUTSIDE THE PRESENTATION CANVAS === */
    makeControls() {
      let controls = document.getElementById('sampleControls');
      if (!controls) {
        controls = document.createElement('nav');
        controls.id = 'sampleControls';
        controls.className = 'deck-controls';
        controls.setAttribute('aria-label', '演示控制');
        controls.innerHTML = '<button type="button" id="samplePrev" aria-label="上一张样稿" title="上一页（←）">←</button><span class="sample-counter" id="sampleCounter" aria-live="polite"></span><button type="button" id="sampleNext" aria-label="下一张样稿" title="下一页（→）">→</button><button type="button" id="sampleEdit" aria-pressed="false" title="切换文字编辑（E）">编辑 E</button><button type="button" id="sampleNotes" aria-expanded="false" title="查看完整备注（N）">备注 N</button><button type="button" id="sampleSave" title="导出当前 HTML（Ctrl+S）">导出</button>';
        document.body.append(controls);
      }
      if (!document.getElementById('sampleNotesPanel')) {
        const panel = document.createElement('aside');
        panel.id = 'sampleNotesPanel';
        panel.className = 'speaker-panel';
        panel.hidden = true;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-labelledby', 'sampleNotesHeading');
        panel.innerHTML = '<h2 id="sampleNotesHeading"></h2><button type="button" id="sampleNotesClose" class="speaker-panel-close" aria-label="关闭备注">×</button><div class="speaker-panel-body" id="sampleNotesBody" tabindex="0"></div>';
        document.body.append(panel);
      }
      if (!document.getElementById('sampleEditHotzone')) {
        const zone = document.createElement('div');
        zone.id = 'sampleEditHotzone';
        zone.className = 'edit-hotzone';
        zone.setAttribute('aria-hidden', 'true');
        document.body.append(zone);
      }
      if (!document.getElementById('sampleEditFloat')) {
        const toggle = document.createElement('button');
        toggle.id = 'sampleEditFloat';
        toggle.type = 'button';
        toggle.className = 'edit-float';
        toggle.textContent = '编辑文字 · E';
        toggle.setAttribute('aria-label', '切换文字编辑');
        document.body.append(toggle);
      }
      if (!document.getElementById('sampleStatus')) {
        const status = document.createElement('div');
        status.id = 'sampleStatus';
        status.className = 'deck-status';
        status.setAttribute('role', 'status');
        document.body.append(status);
      }
      this.controls = controls;
      this.notesPanel = document.getElementById('sampleNotesPanel');
    }

    bindControls() {
      document.getElementById('samplePrev').addEventListener('click', () => this.showSlide(this.currentSlide - 1));
      document.getElementById('sampleNext').addEventListener('click', () => this.showSlide(this.currentSlide + 1));
      document.getElementById('sampleEdit').addEventListener('click', () => this.toggleEditing());
      document.getElementById('sampleEditFloat').addEventListener('click', () => this.toggleEditing());
      document.getElementById('sampleNotes').addEventListener('click', () => this.toggleNotes());
      document.getElementById('sampleNotesClose').addEventListener('click', () => this.toggleNotes(false));
      document.getElementById('sampleSave').addEventListener('click', () => this.exportHtml());
      const zone = document.getElementById('sampleEditHotzone');
      const toggle = document.getElementById('sampleEditFloat');
      const show = () => { clearTimeout(this.hoverTimer); toggle.classList.add('shown'); };
      const hide = () => { this.hoverTimer = setTimeout(() => { if (!this.editing) toggle.classList.remove('shown'); }, 400); };
      [zone, toggle].forEach(node => { node.addEventListener('mouseenter', show); node.addEventListener('mouseleave', hide); });
    }

    /* === UNIFORM 1920 x 1080 SCALE; NO CONTENT REFLOW === */
    scaleStage() {
      const horizontalMargin = 12;
      const topMargin = 10;
      const controlsAllowance = 66;
      const availableWidth = Math.max(1, window.innerWidth - horizontalMargin * 2);
      const availableHeight = Math.max(1, window.innerHeight - topMargin - controlsAllowance);
      const scale = Math.min(availableWidth / 1920, availableHeight / 1080);
      const x = (window.innerWidth - 1920 * scale) / 2;
      const y = topMargin + (availableHeight - 1080 * scale) / 2;
      this.stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      this.stage.dataset.scale = String(scale);
    }

    showSlide(index, updateHash = true) {
      this.currentSlide = Math.max(0, Math.min(index, this.slides.length - 1));
      this.slides.forEach((slide, i) => {
        const active = i === this.currentSlide;
        slide.classList.toggle('active', active);
        slide.classList.toggle('visible', active);
        slide.setAttribute('aria-hidden', String(!active));
        if ('inert' in slide) slide.inert = !active;
      });
      const original = this.slides[this.currentSlide].dataset.originalSlide;
      document.getElementById('sampleCounter').textContent = `样稿 ${this.currentSlide + 1} / ${this.slides.length} · 原稿 ${String(original).padStart(2, '0')} / 39`;
      document.getElementById('samplePrev').disabled = this.currentSlide === 0;
      document.getElementById('sampleNext').disabled = this.currentSlide === this.slides.length - 1;
      if (updateHash) {
        try { history.replaceState(null, '', `#slide-${original}`); } catch { /* Local files may restrict history updates. */ }
      }
      this.updateNotes();
    }

    /* === KEYBOARD, WHEEL AND SWIPE NAVIGATION === */
    isTyping(target) {
      return Boolean(target?.closest?.('[contenteditable="true"], [contenteditable="plaintext-only"], input, textarea, select'));
    }
    setupKeyboard() {
      document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); this.exportHtml(); return; }
        if (event.key === 'Escape') {
          if (this.editing) this.toggleEditing(false);
          else if (!this.notesPanel.hidden) this.toggleNotes(false);
          return;
        }
        if (this.isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key.toLowerCase() === 'e') { event.preventDefault(); this.toggleEditing(); return; }
        if (event.key.toLowerCase() === 'n') { event.preventDefault(); this.toggleNotes(); return; }
        if (event.target.closest?.('.speaker-panel')) return;
        const next = ['ArrowRight', 'ArrowDown', ' ', 'PageDown'];
        const previous = ['ArrowLeft', 'ArrowUp', 'PageUp'];
        if (next.includes(event.key)) { event.preventDefault(); this.showSlide(this.currentSlide + 1); }
        else if (previous.includes(event.key)) { event.preventDefault(); this.showSlide(this.currentSlide - 1); }
        else if (event.key === 'Home') { event.preventDefault(); this.showSlide(0); }
        else if (event.key === 'End') { event.preventDefault(); this.showSlide(this.slides.length - 1); }
      });
    }
    setupWheelAndTouch() {
      document.addEventListener('wheel', event => {
        if (this.editing || event.ctrlKey || event.target.closest?.('.speaker-panel, .deck-controls')) return;
        event.preventDefault();
        const now = performance.now();
        if (now - this.lastWheelMove < 480) return;
        if (now - this.lastWheelEvent > 250) this.wheelTotal = 0;
        this.lastWheelEvent = now;
        this.wheelTotal += event.deltaMode === 1 ? event.deltaY * 18 : event.deltaY;
        if (Math.abs(this.wheelTotal) >= 70) {
          this.showSlide(this.currentSlide + (this.wheelTotal > 0 ? 1 : -1));
          this.wheelTotal = 0;
          this.lastWheelMove = now;
        }
      }, { passive: false });
      document.addEventListener('touchstart', event => {
        if (this.editing || event.target.closest?.('.speaker-panel, .deck-controls, button')) return;
        const touch = event.changedTouches[0];
        this.touchStart = { x: touch.clientX, y: touch.clientY };
      }, { passive: true });
      document.addEventListener('touchend', event => {
        if (!this.touchStart || this.editing) return;
        const touch = event.changedTouches[0];
        const dx = this.touchStart.x - touch.clientX;
        const dy = this.touchStart.y - touch.clientY;
        this.touchStart = null;
        if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.25) this.showSlide(this.currentSlide + (dx > 0 ? 1 : -1));
      }, { passive: true });
    }

    /* === LOCAL TEXT EDITS; ORIGINAL SOURCE ATTRIBUTES STAY INTACT === */
    setupEditing() {
      this.stage.querySelectorAll('[data-edit-key]').forEach(element => {
        element.setAttribute('contenteditable', 'false');
        element.setAttribute('spellcheck', 'false');
        element.addEventListener('input', () => this.saveEdits());
        element.addEventListener('paste', event => {
          if (!this.editing) return;
          event.preventDefault();
          const text = event.clipboardData?.getData('text/plain') ?? '';
          const selection = window.getSelection();
          if (!selection?.rangeCount) return;
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const node = document.createTextNode(text);
          range.insertNode(node);
          range.setStartAfter(node);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          this.saveEdits();
        });
      });
    }
    toggleEditing(force) {
      this.editing = typeof force === 'boolean' ? force : !this.editing;
      document.body.classList.toggle('editing', this.editing);
      this.stage.querySelectorAll('[data-edit-key]').forEach(element => element.setAttribute('contenteditable', this.editing ? 'plaintext-only' : 'false'));
      document.getElementById('sampleEdit').setAttribute('aria-pressed', String(this.editing));
      document.getElementById('sampleEdit').textContent = this.editing ? '完成编辑' : '编辑 E';
      document.getElementById('sampleEditFloat').classList.toggle('shown', this.editing);
      document.getElementById('sampleEditFloat').textContent = this.editing ? '完成编辑 · Esc' : '编辑文字 · E';
      if (this.editing) this.status('点击文字即可编辑；修改保存在本机。按 Esc 完成。');
      else { document.activeElement?.blur?.(); this.saveEdits(); }
    }
    restoreEdits() {
      try {
        const edits = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        this.stage.querySelectorAll('[data-edit-key]').forEach(element => {
          if (typeof edits[element.dataset.editKey] === 'string') element.textContent = edits[element.dataset.editKey];
        });
      } catch { /* The source still works when local storage is unavailable. */ }
    }
    saveEdits() {
      const edits = {};
      this.stage.querySelectorAll('[data-edit-key]').forEach(element => { edits[element.dataset.editKey] = element.textContent; });
      try { localStorage.setItem(this.storageKey, JSON.stringify(edits)); } catch { /* Export remains available in private browsers. */ }
    }

    /* === ORIGINAL SPEAKER NOTES, INCLUDING ALL REFERENCES === */
    updateNotes() {
      const slide = this.slides[this.currentSlide];
      document.getElementById('sampleNotesHeading').textContent = `原稿第 ${slide.dataset.originalSlide} 页 · 完整备注`;
      document.getElementById('sampleNotesBody').textContent = slide.querySelector('template[data-speaker-notes]')?.content.textContent || '';
    }
    toggleNotes(force) {
      const open = typeof force === 'boolean' ? force : this.notesPanel.hidden;
      this.notesPanel.hidden = !open;
      document.getElementById('sampleNotes').setAttribute('aria-expanded', String(open));
      this.updateNotes();
      if (open) document.getElementById('sampleNotesBody').focus();
      else document.getElementById('sampleNotes').focus();
    }

    /* === EXPORT A SNAPSHOT WITH THE CURRENT EDITED TEXT === */
    exportHtml() {
      this.saveEdits();
      const clone = document.documentElement.cloneNode(true);
      const body = clone.querySelector('body');
      body.classList.remove('editing');
      body.dataset.startOriginalSlide = this.slides[this.currentSlide].dataset.originalSlide;
      clone.querySelectorAll('[contenteditable]').forEach(element => element.setAttribute('contenteditable', 'false'));
      clone.querySelector('#sampleNotesPanel').hidden = true;
      clone.querySelector('#sampleEdit').textContent = '编辑 E';
      clone.querySelector('#sampleEdit').setAttribute('aria-pressed', 'false');
      clone.querySelector('#sampleNotes').setAttribute('aria-expanded', 'false');
      clone.querySelector('#sampleEditFloat').classList.remove('shown');
      clone.querySelector('#sampleStatus').classList.remove('shown');
      clone.querySelectorAll('base').forEach(base => base.remove());
      const blob = new Blob(['<!doctype html>\n' + clone.outerHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ai-blue-professional-samples-edited.html';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      this.status('已导出 HTML；请与 assets 文件夹放在一起。');
    }
    status(message) {
      const element = document.getElementById('sampleStatus');
      element.textContent = message;
      element.classList.add('shown');
      clearTimeout(this.statusTimer);
      this.statusTimer = setTimeout(() => element.classList.remove('shown'), 2800);
    }
  }
  const start = () => { window.sampleDeck = new SamplePresentation(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
