import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { TodosService } from '../todo.service';
import { fromEvent, debounceTime, map } from 'rxjs';

@Component({
  selector: 'app-search',
  imports: [],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements AfterViewInit {
  private todosService = inject(TodosService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef;

  ngAfterViewInit(): void {
    const subscription = fromEvent(this.searchInput.nativeElement, 'input')
      .pipe(
        debounceTime(300),
        map((e: any) => e.target.value.trim().toLowerCase())
      )
      .subscribe((query) => this.todosService.updateSearchQuery(query));

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
    });
  }
}
