import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  userInput = '';
  messages: any[] = [];
  isLoading = false;
  sessionId = '';
  showChecklist = false;
  checklistSections: {
    heading: string;
    items: { text: string; selected: boolean }[];
    editing?: boolean;
  }[] = [];
  showModal = false;
  selectedItems: { section: string; text: string; selected: boolean }[] = [];

  @ViewChild('chatMessages') private chatMessages!: ElementRef;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.generateSessionId();
    this.loadConversationHistory();
    const initialPrompt = this.route.snapshot.data['initialPrompt'];
    if (initialPrompt) {
      this.userInput = initialPrompt;
      // Defer to ensure view initialized states don't conflict
      setTimeout(() => this.sendMessage());
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  generateSessionId() {
    this.sessionId =
      'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  trackByMessage(index: number, message: any): string {
    return message.id || index;
  }

  scrollToBottom(): void {
    try {
      this.chatMessages.nativeElement.scrollTop =
        this.chatMessages.nativeElement.scrollHeight;
    } catch (err) {}
  }

  formatAIResponse(content: string): string {
    if (!content) return '';

    let formattedContent = content;

    // Convert markdown-style formatting to HTML
    formattedContent = formattedContent
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="code-block"><code>$1</code></pre>'
      )
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="response-header">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="response-header">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="response-header">$1</h1>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Convert consecutive <li> tags to <ul>
      .replace(/(<li>.*<\/li>)/gs, '<ul class="response-list">$1</ul>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Emojis and special characters
      .replace(/✅/g, '<span class="emoji">✅</span>')
      .replace(/❌/g, '<span class="emoji">❌</span>')
      .replace(/🎉/g, '<span class="emoji">🎉</span>')
      .replace(/🚀/g, '<span class="emoji">🚀</span>')
      .replace(/📋/g, '<span class="emoji">📋</span>')
      .replace(/🔧/g, '<span class="emoji">🔧</span>')
      .replace(/⚙️/g, '<span class="emoji">⚙️</span>')
      .replace(/🧪/g, '<span class="emoji">🧪</span>')
      .replace(/🎯/g, '<span class="emoji">🎯</span>')
      .replace(/🛠️/g, '<span class="emoji">🛠️</span>')
      .replace(/📁/g, '<span class="emoji">📁</span>')
      .replace(/🔮/g, '<span class="emoji">🔮</span>')
      .replace(/🚨/g, '<span class="emoji">🚨</span>')
      .replace(/🔄/g, '<span class="emoji">🔄</span>');

    // Add paragraph breaks for better readability
    formattedContent = formattedContent.replace(/<br><br>/g, '</p><p>');
    formattedContent = '<p>' + formattedContent + '</p>';

    return formattedContent;
  }

  sendMessage() {
    const message = this.userInput.trim();
    if (!message || this.isLoading) return;

    // Add user message
    const userMessage = {
      role: 'User',
      content: message,
      timestamp: new Date(),
      id: Date.now() + '_user',
    };
    this.messages.push(userMessage);
    this.userInput = '';
    this.isLoading = true;

    // Send to AI
    this.http
      .post<any>('http://localhost:3000/api/chat', {
        message,
        sessionId: this.sessionId,
      })
      .subscribe(
        (res) => {
          const aiMessage = {
            role: 'AI',
            content: res.reply,
            timestamp: new Date(),
            id: Date.now() + '_ai',
          };
          this.messages.push(aiMessage);
          this.isLoading = false;

          // If this response looks like a checklist, parse and show editable list
          if (this.shouldTreatAsChecklist(message, res.reply)) {
            this.populateChecklistFromResponse(res.reply);
            this.showChecklist = true;
          }
        },
        (err) => {
          const errorMessage = {
            role: 'AI',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
            id: Date.now() + '_error',
          };
          this.messages.push(errorMessage);
          this.isLoading = false;
          console.error('Error communicating with AI:', err);
        }
      );
  }

  async loadConversationHistory() {
    try {
      const response = await this.http
        .get<any>(`http://localhost:3000/api/conversation/${this.sessionId}`)
        .toPromise();
      if (response.messages && response.messages.length > 0) {
        this.messages = response.messages.map((msg: any) => ({
          role: msg.role === 'user' ? 'User' : 'AI',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          id: msg.id,
        }));
      }
    } catch (error) {
      console.log('No existing conversation found or error loading history');
    }
  }

  async clearChat() {
    try {
      await this.http
        .delete(`http://localhost:3000/api/conversation/${this.sessionId}`)
        .toPromise();
      this.messages = [];
      this.showChecklist = false;
      this.checklistSections = [];
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  }

  newSession() {
    this.generateSessionId();
    this.messages = [];
    this.showChecklist = false;
    this.checklistSections = [];
  }

  private shouldTreatAsChecklist(userPrompt: string, aiReply: string): boolean {
    const fromGenerateRoute = !!this.route.snapshot.data['initialPrompt'];
    const mentionsChecklist =
      /checklist/i.test(userPrompt) || /checklist/i.test(aiReply);
    const looksLikeList = /(^\s*[-*]\s+.+)|(^\s*\d+\.|\d+\))\s+.+/m.test(
      aiReply
    );
    return (
      (fromGenerateRoute && looksLikeList) ||
      (mentionsChecklist && looksLikeList)
    );
  }

  private populateChecklistFromResponse(content: string) {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const sections: {
      heading: string;
      items: { text: string; selected: boolean }[];
    }[] = [];
    let currentSection: {
      heading: string;
      items: { text: string; selected: boolean }[];
    } | null = null;

    const isHeading = (line: string) =>
      /^(#{1,3}\s+.+)|(^[A-Za-z].+:$)|(^\*\*.+\*\*$)/.test(line);
    const normalizeHeading = (line: string) =>
      line
        .replace(/^#{1,3}\s+/, '')
        .replace(/:$/, '')
        .replace(/^\*\*(.+)\*\*$/, '$1')
        .trim();

    for (const line of lines) {
      if (isHeading(line)) {
        const heading = normalizeHeading(line);
        currentSection = { heading, items: [] };
        sections.push(currentSection);
        continue;
      }

      const bulletMatch = line.match(/^[-*]\s+(.*)$/);
      const numberedMatch = line.match(/^\s*(\d+\.|\d+\))\s+(.*)$/);
      let text: string | null = null;
      if (bulletMatch) text = bulletMatch[1].trim();
      else if (numberedMatch) text = numberedMatch[2].trim();

      // Bold-only bullet/numbered lines become new section headings
      if (text && /^\*\*.+\*\*:?$/.test(text)) {
        const heading = text.replace(/^\*\*(.+)\*\*:?$/, '$1').trim();
        currentSection = { heading, items: [] };
        sections.push(currentSection);
        continue;
      }

      if (text) {
        // Strip any leading markdown checkbox tokens like [ ], [x], [X]
        text = this.cleanLeadingCheckbox(text);
        // Skip items that end with a colon (likely section labels)
        if (/:\s*$/.test(text)) {
          continue;
        }
        if (!currentSection) {
          currentSection = { heading: 'Checklist', items: [] };
          sections.push(currentSection);
        }
        currentSection.items.push({ text, selected: false });
      }
    }

    // Fallback if nothing matched
    if (sections.length === 0) {
      const fallbackItems: string[] = [];
      const bullets = content.match(/^\s*[-*]\s+.+/gm) || [];
      const numbers = content.match(/^(?:\s*\d+\.|\d+\))\s+.+/gm) || [];
      const all = bullets.concat(numbers);
      if (all.length > 0) {
        all.forEach((l) => {
          let t = l.replace(/^\s*([-*]|\d+\.|\d+\))\s+/, '').trim();
          t = this.cleanLeadingCheckbox(t);
          if (!/:\s*$/.test(t)) {
            fallbackItems.push(t);
          }
        });
      } else {
        const semiSplit = content
          .split(/;|\u2022/g)
          .map((s) => s.trim())
          .filter((s) => s);
        if (semiSplit.length > 1) {
          semiSplit.forEach((s) => {
            let t = s.replace(/^[\-\*\d\.\)]+\s*/, '').trim();
            t = this.cleanLeadingCheckbox(t);
            if (!/:\s*$/.test(t)) {
              fallbackItems.push(t);
            }
          });
        }
      }
      sections.push({
        heading: 'Checklist',
        items: fallbackItems.map((t) => ({ text: t, selected: false })),
      });
    }

    this.checklistSections = sections;
  }

  addChecklistItem(sectionIndex: number) {
    this.checklistSections[sectionIndex].items.push({
      text: '',
      selected: false,
    });
  }

  addChecklistSection() {
    this.checklistSections.push({
      heading: 'New Section',
      items: [],
      editing: true,
    });
  }

  finishEditSection(index: number) {
    const section = this.checklistSections[index];
    if (!section) return;
    section.heading = (section.heading || '').trim() || 'Untitled Section';
    section.editing = false;
  }

  isItemDisabled(item: { text: string; selected: boolean }): boolean {
    return !item.text || !item.text.trim();
  }

  hasAnySelected(): boolean {
    return this.checklistSections.some((s) => s.items.some((i) => i.selected));
  }

  onItemTextChange(item: { text: string; selected: boolean }) {
    if (!item.text || !item.text.trim()) {
      // Uncheck before disabling
      item.selected = false;
    }
    // Remove leading markdown checkbox tokens like [ ], [x], [X]
    if (item.text) {
      item.text = this.cleanLeadingCheckbox(item.text);
    }
  }

  private cleanLeadingCheckbox(text: string): string {
    return text.replace(/^\s*\[\s*[xX]?\s*\]\s*/, '');
  }

  saveChecklist() {
    if (!this.hasAnySelected()) {
      // Show error toast and do not open modal
      this.toast.show(
        'Please select some checklist item to proceed!',
        'error',
        5000
      );
      return;
    }
    const selected = this.checklistSections.flatMap((section) =>
      section.items
        .filter((item) => item.selected)
        .map((item) => ({
          section: section.heading,
          text: item.text,
          selected: true,
        }))
    );
    this.selectedItems = selected;
    this.showModal = true;
    console.log('Selected checklist:', selected);
  }

  closeModal() {
    this.showModal = false;
  }

  saveFinalChecklist() {
    // Here you could save to backend, localStorage, etc.
    this.closeModal();
    this.toast.show(
      'Finalized QC Checklist has been saved successfully for this equipment!',
      'success',
      5000
    );
  }

  getSelectedItemsBySection() {
    const grouped: {
      sectionName: string;
      items: { text: string; selected: boolean }[];
    }[] = [];
    const sectionMap = new Map<string, { text: string; selected: boolean }[]>();

    this.selectedItems.forEach((item) => {
      if (!sectionMap.has(item.section)) {
        sectionMap.set(item.section, []);
      }
      sectionMap.get(item.section)!.push(item);
    });

    sectionMap.forEach((items, sectionName) => {
      grouped.push({ sectionName, items });
    });

    return grouped;
  }
}
