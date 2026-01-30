import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription, take } from 'rxjs';

// material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

// myrmidon
import { EnvService, RamStorageService } from '@myrmidon/ngx-tools';
import { User, AuthJwtService, GravatarPipe } from '@myrmidon/auth-jwt-login';

// cadmus
import { ZoteroRefLookupService } from '@myrmidon/cadmus-refs-zotero-lookup';
import { ThesaurusEntry, Thesaurus } from '@myrmidon/cadmus-core';
import { LOOKUP_CONFIGS_KEY, RefLookupConfig } from '@myrmidon/cadmus-refs-lookup';
import { AppRepository } from '@myrmidon/cadmus-state';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    GravatarPipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private readonly _subs: Subscription[] = [];

  public user?: User;
  public logged?: boolean;
  public itemBrowsers?: ThesaurusEntry[];
  public version: string;

  constructor(
    @Inject('itemBrowserKeys')
    private _itemBrowserKeys: { [key: string]: string },
    private _authService: AuthJwtService,
    private _appRepository: AppRepository,
    private _router: Router,
    env: EnvService,
    storage: RamStorageService,
    zotero: ZoteroRefLookupService,
  ) {
    this.version = env.get('version') || '';

    // configure external lookup for asserted composite IDs
    storage.store(LOOKUP_CONFIGS_KEY, [
      // Zotero
      {
        name: 'Zotero',
        iconUrl: '/img/zotero128.png',
        description: 'Zotero bibliography',
        label: 'ID',
        service: zotero,
        itemIdGetter: (item: any) => (item ? `${item.library?.id}/${item.key}` : ''),
        itemLabelGetter: (item: any) => {
          if (!item) {
            return '';
          }
          const sb: string[] = [];
          if (item.data?.creators && Array.isArray(item.data.creators)) {
            const creators = item.data.creators;
            for (let i = 0; i < creators.length; i++) {
              const c = creators[i];
              if (i > 0) {
                sb.push('; ');
              }
              if (c.lastName) {
                sb.push(c.lastName);
              }
              if (c.firstName) {
                sb.push(' ' + c.firstName.charAt(0) + '.');
              }
            }
          }
          sb.push(': ');
          if (item.title) {
            sb.push(item.title);
          } else if (item.data?.title) {
            sb.push(item.data?.title);
          }
          return sb.join('');
        },
      },
    ] as RefLookupConfig[]);
  }

  public ngOnInit(): void {
    this.user = this._authService.currentUserValue || undefined;
    this.logged = this.user !== null;

    // when the user logs in or out, reload the app data
    this._subs.push(
      this._authService.currentUser$.subscribe((user: User | null) => {
        this.logged = this._authService.isAuthenticated(true);
        this.user = user || undefined;
        if (user) {
          console.log('User logged in: ', user);
          this._appRepository.load();
        } else {
          console.log('User logged out');
        }
      }),
    );

    // when the thesaurus is loaded, get the item browsers
    this._subs.push(
      this._appRepository.itemBrowserThesaurus$.subscribe((thesaurus: Thesaurus | undefined) => {
        this.itemBrowsers = thesaurus ? thesaurus.entries : undefined;
      }),
    );
  }

  public ngOnDestroy(): void {
    this._subs.forEach((s) => s.unsubscribe());
  }

  public getItemBrowserRoute(id: string): string {
    return this._itemBrowserKeys[id] || id;
  }

  public logout(): void {
    if (!this.logged) {
      return;
    }
    this._authService
      .logout()
      .pipe(take(1))
      .subscribe((_) => {
        this._router.navigate(['/home']);
      });
  }
}
