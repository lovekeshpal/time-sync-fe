import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LayoutService } from '../../../services/layout/layout.service';

@Component({
  selector: 'app-timer-screen',
  imports: [],
  templateUrl: './timer-screen.component.html',
  styleUrl: './timer-screen.component.scss',
})
export class TimerScreenComponent {
  constructor(
    private route: ActivatedRoute,
    private layoutService: LayoutService
  ) {}

  ngOnInit(): void {
    // Use setTimeout to delay the visibility change to the next change detection cycle
    setTimeout(() => {
      this.layoutService.setHeaderVisibility(false);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      console.log(`ID from URL: ${id}`);
    } else {
      console.log('ID not present in the URL');
    }
  }

  ngOnDestroy(): void {
    // Restore header and footer when component is destroyed
    this.layoutService.setHeaderVisibility(true);
  }
}
