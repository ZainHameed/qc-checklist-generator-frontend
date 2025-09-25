import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatRequest {
  message: string;
  sessionId: string;
}

export interface ChatResponse {
  reply: string;
}

export interface ConversationResponse {
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    id: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = environment.apiUrl;
  }

  /**
   * Send a chat message to the AI
   */
  sendChatMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, request);
  }

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId: string): Observable<ConversationResponse> {
    return this.http.get<ConversationResponse>(
      `${this.baseUrl}/conversation/${sessionId}`
    );
  }

  /**
   * Delete conversation history for a session
   */
  deleteConversation(sessionId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/conversation/${sessionId}`);
  }
}
