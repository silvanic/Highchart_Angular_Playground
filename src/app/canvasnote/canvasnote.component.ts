import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface Note {
  content: string;
  position: { x: number; y: number };
}

enum DragState {
  DRAG,
  NO_DRAG,
}

@Component({
  standalone: true,
  selector: 'app-canvas-note',
  templateUrl: './canvasnote.component.html',
  styleUrls: ['./canvasnote.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class CanvasNoteComponent {
  @ViewChild('canvasElement', { static: true })
  canvasElement!: ElementRef<HTMLDivElement>;
  notes = signal<Note[]>([]);
  draggingNote: Note | null = null;
  offsetX = 0;
  offsetY = 0;
  state = DragState.NO_DRAG;

  addNoteBox(event: MouseEvent) {
    console.log(event);
    if (!(event.target as HTMLElement).classList.contains('canvas')) return;
    const rect = this.canvasElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.notes.update(value => [...value, { content: '', position: { x, y } }]);
  }

  startDragging(note: Note, event: MouseEvent) {
    this.state = DragState.DRAG;
    this.draggingNote = note;
    this.offsetX = event.clientX - note.position.x;
    this.offsetY = event.clientY - note.position.y;

    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDragging.bind(this));
  }

  drag(event: MouseEvent) {
    if (!this.draggingNote) return;

    this.draggingNote.position.x = event.clientX - this.offsetX;
    this.draggingNote.position.y = event.clientY - this.offsetY;
  }

  stopDragging() {
    this.draggingNote = null;
    document.removeEventListener('mousemove', this.drag.bind(this));
    document.removeEventListener('mouseup', this.stopDragging.bind(this));
    this.state = DragState.NO_DRAG;
  }

  onResize(event: UIEvent) {
    console.log(event);
  }
}
