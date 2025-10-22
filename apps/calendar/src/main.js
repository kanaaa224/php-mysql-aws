// 処理に必要な関数を分割代入で取得
const { createApp, ref, onMounted, nextTick, reactive } = Vue;
const { createVuetify, useTheme, useDisplay } = Vuetify;

// 初期処理を非同期で実行（IIFE）
// ローカルスコープを形成し、非同期処理（APIコールなど）に対応した形でアプリ初期処理を行っています。
(async () => {
    let api_default_endpoint_url = API_ENDPOINTS_URLS[0];

    // 汎用 API呼び出し 関数
    // エントリーポイント（index.html）で定義されたエンドポイントへAPIコールします。
    const callAPI = async (endpoint = api_default_endpoint_url, queries = {}, requestBody = null) => {
        const url = new URL(endpoint);

        for(const [ key, value ] of Object.entries(queries)) url.searchParams.set(key, value);

        let request = { method: 'GET' };

        if(requestBody) request = { method: 'POST', body: JSON.stringify(requestBody) };

        const response = await fetch(url.toString(), request);
        const body     = await response.json();

        if(!response.ok) throw new Error(`api-bad-status: ${response.status}`);

        return body;
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // App インスタンス作成

    const app = createApp({
        setup() {
            const theme   = useTheme();
            const display = useDisplay();

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // 汎用 変数・関数

            const developer = ref({});

            const calendar = reactive(new Calendar()); // カレンダーインスタンス

            const eventDialog  = ref(false); // イベント入力ダイアログ表示フラグ
            const editingEvent = ref(null);  // 編集中のイベント情報

            const eventForm = reactive({ date: '', title: '', description: ''}); // イベント入力データ

            // 今日かどうかを判定
            const isToday = (day) => {
                const today = new Date();

                return calendar.getCurrentYear() === today.getFullYear() && calendar.getCurrentMonth() === today.getMonth() && day === today.getDate();
            };

            // 日付選択
            const selectDate = (day) => {
                const dateStr = `${calendar.getCurrentYear()}-${String(calendar.getCurrentMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                calendar.setCurrentDate(new Date(calendar.getCurrentYear(), calendar.getCurrentMonth(), day));

                calendar.setViewMode('day');
            };

            // 月選択
            const selectMonth = (month) => {
                calendar.currentDate.setMonth(month);

                calendar.setViewMode('month');
            };

            // イベント追加ダイアログ表示
            const showAddEventDialog = (date) => {
                editingEvent.value = null;

                eventForm.date        = date;
                eventForm.title       = '';
                eventForm.description = '';

                eventDialog.value = true;
            };

            // イベント編集ダイアログ表示
            const showEditEventDialog = (event) => {
                editingEvent.value = event;

                eventForm.date        = event.date;
                eventForm.title       = event.title;
                eventForm.description = event.description || '';

                eventDialog.value = true;
            };

            // イベント保存
            const saveEvent = () => {
                if(!eventForm.title) return;

                if(editingEvent.value) {
                    calendar.updateEvent(editingEvent.value.id, eventForm.date, eventForm.title, eventForm.description);
                } else {
                    calendar.addEvent(eventForm.date, eventForm.title, eventForm.description);
                }

                eventDialog.value = false;
            };

            // イベント削除
            const deleteEvent = (id) => {
                calendar.deleteEvent(id);
            };

            const db = reactive({
                load: async () => {
                    try {
                        const response = await callAPI('http://localhost:8080/api/v1/', {}, { method: 'db_data_get', params: { name: 'calendar_events' } });

                        if(!response.status) throw new Error('api-bad-status');

                        if(response.data.result === 'failed') return;

                        calendar.events = response.data.value;
                    } catch(e) {
                        console.error(e);
                    }
                },
                save: async () => {
                    try {
                        const response = await callAPI('http://localhost:8080/api/v1/', {}, { method: 'db_data_set', params: { name: 'calendar_events', data: calendar.events } });

                        if(!response.status) throw new Error('api-bad-status');

                        if(response.data.result === 'failed') return;
                    } catch(e) {
                        console.error(e);
                    }
                },
                clear: async () => {
                    try {
                        const response = await callAPI('http://localhost:8080/api/v1/', {}, { method: 'db_data_set', params: { name: 'calendar_events', data: {} } });

                        if(!response.status) throw new Error('api-bad-status');

                        if(response.data.result === 'failed') return;
                    } catch(e) {
                        console.error(e);
                    }
                }
            })

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // ダイアログ

            const dialog_settings_visible = ref(false);

            const dialog_settings = (option = '') => {
                if(!dialog_settings_visible.value) {
                    dialog_settings_visible.value = true;

                    return;
                }

                switch(option) {
                    case 'app_storage_clear':
                        localStorage.removeItem('calendar_events');
                        break;
                }
            };

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // App マウント後の処理

            const container_visible = ref(false);

            onMounted(async () => {
                document.title = APP_NAME;

                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                    theme.global.name.value = e.matches ? 'dark' : 'light';
                });

                try {
                    developer.value = await callAPI();
                } catch(e) {
                    console.error(e);
                }

                ((l) => (l.href = developer.value.avatar_url, document.head.appendChild(l)))(document.querySelector("link[rel='icon']")             || Object.assign(document.createElement("link"), { rel: "icon" }));
                ((l) => (l.href = developer.value.avatar_url, document.head.appendChild(l)))(document.querySelector("link[rel='apple-touch-icon']") || Object.assign(document.createElement("link"), { rel: "apple-touch-icon" }));

                container_visible.value = true;
            });

            return {
                api,

                theme,
                display,

                developer,
                calendar,
                eventDialog,
                editingEvent,
                eventForm,
                isToday,
                selectDate,
                selectMonth,
                showAddEventDialog,
                showEditEventDialog,
                saveEvent,
                deleteEvent,
                db,

                dialog_settings_visible,
                dialog_settings,

                container_visible
            }
        },
        template: `
            <v-app style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);">
                <v-dialog
                    v-model="dialog_settings_visible"
                    transition="dialog-bottom-transition"
                    fullscreen
                >
                    <v-card style="padding-top: env(safe-area-inset-top);">
                        <v-toolbar>
                            <v-toolbar-title>設定</v-toolbar-title>
                            <v-toolbar-items>
                                <v-btn
                                    icon="mdi-close"
                                    @click="dialog_settings_visible = false"
                                />
                            </v-toolbar-items>
                        </v-toolbar>
                        <v-list lines="two">
                            <v-list-subheader title="一般" />
                            <v-list-item
                                title="アプリで保存されたデータを削除"
                                subtitle="サーバーに保存されたデータは消えません"
                                @click="dialog_settings('app_storage_clear')"
                            ><template #append><v-icon icon="mdi-chevron-right" /></template></v-list-item>
                            <v-divider />
                            <v-list-subheader title="アプリケーション" />
                            <v-list-item
                                title="バージョン"
                                subtitle="v1.0"
                            />
                            <v-divider />
                            <v-list-item
                                class="text-center"
                                subtitle="© 2025 kanaaa224. All rights reserved."
                                href="https://kanaaa224.github.io/"
                                target="_blank"
                                rel="noopener"
                            />
                        </v-list>
                    </v-card>
                </v-dialog>
                <v-main>
                    <v-fade-transition mode="out-in">
                        <v-container v-if="container_visible">
                            <v-card class="card-shadow" elevation="0">
                                <v-card-title class="d-flex align-center justify-space-between">
                                    <div class="d-flex align-center">
                                        <v-btn icon size="small" @click="calendar.prevPeriod()">
                                            <v-icon>mdi-chevron-left</v-icon>
                                        </v-btn>
                                        <v-btn icon size="small" @click="calendar.today()" class="mx-2">
                                            <v-icon>mdi-calendar-today</v-icon>
                                        </v-btn>
                                        <v-btn icon size="small" @click="calendar.nextPeriod()">
                                            <v-icon>mdi-chevron-right</v-icon>
                                        </v-btn>
                                        <span class="ml-4 text-h6">
                                            <template v-if="calendar.viewMode === 'day'">
                                                {{ calendar.getCurrentYear() }}年{{ calendar.getCurrentMonth() + 1 }}月{{ calendar.getCurrentDay() }}日
                                            </template>
                                            <template v-else-if="calendar.viewMode === 'month'">
                                                {{ calendar.getCurrentYear() }}年{{ calendar.getCurrentMonth() + 1 }}月
                                            </template>
                                            <template v-else>
                                                {{ calendar.getCurrentYear() }}年
                                            </template>
                                        </span>
                                    </div>
                                    <div>
                                        <v-btn-toggle v-model="calendar.viewMode" mandatory density="compact">
                                            <v-btn value="day" size="small">日</v-btn>
                                            <v-btn value="month" size="small">月</v-btn>
                                            <v-btn value="year" size="small">年</v-btn>
                                        </v-btn-toggle>
                                    </div>
                                </v-card-title>
                                <v-divider />

                                <!-- 日表示 -->
                                <v-card-text v-if="calendar.viewMode === 'day'" style="min-height: 400px;">
                                    <div class="d-flex justify-space-between align-center mb-4">
                                        <h3>{{ calendar.getCurrentYear() }}年{{ calendar.getCurrentMonth() + 1 }}月{{ calendar.getCurrentDay() }}日のイベント</h3>
                                        <v-btn color="primary" size="small" @click="showAddEventDialog(calendar.formatDate(calendar.currentDate))">
                                            <v-icon left>mdi-plus</v-icon>
                                            イベント追加
                                        </v-btn>
                                    </div>
                                    <v-list v-if="calendar.getEventsForDate(calendar.formatDate(calendar.currentDate)).length > 0">
                                        <v-list-item
                                            v-for="event in calendar.getEventsForDate(calendar.formatDate(calendar.currentDate))"
                                            :key="event.id"
                                            style="border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; margin-bottom: 8px;"
                                        >
                                            <v-list-item-title>{{ event.title }}</v-list-item-title>
                                            <v-list-item-subtitle v-if="event.description">{{ event.description }}</v-list-item-subtitle>
                                            <template v-slot:append>
                                                <v-btn variant="plain" size="small" @click="showEditEventDialog(event)">
                                                    <v-icon>mdi-pencil</v-icon>
                                                </v-btn>
                                                <v-btn variant="plain" size="small" color="error" @click="deleteEvent(event.id)">
                                                    <v-icon>mdi-delete</v-icon>
                                                </v-btn>
                                            </template>
                                        </v-list-item>
                                    </v-list>
                                    <div v-else class="text-center text-grey pa-8">
                                        イベントがありません
                                    </div>
                                </v-card-text>

                                <!-- 月表示 -->
                                <v-card-text v-if="calendar.viewMode === 'month'">
                                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
                                        <div v-for="day in [ '日', '月', '火', '水', '木', '金', '土' ]" :key="day"
                                            style="text-align: center; font-weight: bold; padding: 8px; background-color: rgba(0,0,0,0.05); border-radius: 4px;">
                                            {{ day }}
                                        </div>
                                        <div v-for="n in calendar.getMonthDays(calendar.getCurrentYear(), calendar.getCurrentMonth()).startDayOfWeek"
                                            :key="'empty-' + n"></div>
                                        <div
                                            v-for="day in calendar.getMonthDays(calendar.getCurrentYear(), calendar.getCurrentMonth()).daysInMonth"
                                            :key="day"
                                            @click="selectDate(day)"
                                            style="min-height: 80px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 4px; cursor: pointer; transition: all 0.2s;"
                                            :style="{
                                                backgroundColor: isToday(day) ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                                                borderColor: isToday(day) ? '#2196f3' : 'rgba(0,0,0,0.1)'
                                            }"
                                            @mouseenter="e => e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.05)'"
                                            @mouseleave="e => e.target.style.backgroundColor = isToday(day) ? 'rgba(33, 150, 243, 0.1)' : 'transparent'"
                                        >
                                            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">{{ day }}</div>
                                            <div v-for="event in calendar.getEventsForDate(calendar.getCurrentYear() + '-' + String(calendar.getCurrentMonth() + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'))"
                                                :key="event.id"
                                                style="font-size: 11px; background-color: #2196f3; color: white; padding: 2px 4px; border-radius: 3px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                {{ event.title }}
                                            </div>
                                        </div>
                                    </div>
                                </v-card-text>

                                <!-- 年表示 -->
                                <v-card-text v-if="calendar.viewMode === 'year'">
                                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
                                        <div v-for="month in 12" :key="month"
                                            style="border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s;"
                                            @click="selectMonth(month - 1)"
                                            @mouseenter="e => e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.05)'"
                                            @mouseleave="e => e.target.style.backgroundColor = 'transparent'">
                                            <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">{{ month }}月</div>
                                            <div style="font-size: 13px; color: #666;">
                                                イベント: {{ calendar.getEventsForMonth(calendar.getCurrentYear(), month - 1).length }}件
                                            </div>
                                            <div v-if="calendar.getEventsForMonth(calendar.getCurrentYear(), month - 1).length > 0" style="margin-top: 8px;">
                                                <div v-for="event in calendar.getEventsForMonth(calendar.getCurrentYear(), month - 1).slice(0, 3)"
                                                    :key="event.id"
                                                    style="font-size: 12px; padding: 4px; background-color: rgba(33, 150, 243, 0.1); border-radius: 4px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                    {{ event.date.split('-')[2] }}日: {{ event.title }}
                                                </div>
                                                <div v-if="calendar.getEventsForMonth(calendar.getCurrentYear(), month - 1).length > 3"
                                                    style="font-size: 11px; color: #999; margin-top: 4px;">
                                                    +{{ calendar.getEventsForMonth(calendar.getCurrentYear(), month - 1).length - 3 }}件
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </v-card-text>
                            </v-card>

                            <!-- イベント追加/編集ダイアログ -->
                            <v-dialog v-model="eventDialog" width="500">
                                <v-card>
                                    <v-card-title>
                                        {{ editingEvent ? 'イベント編集' : 'イベント追加' }}
                                    </v-card-title>
                                    <v-card-text>
                                        <v-text-field
                                            v-model="eventForm.date"
                                            label="日付"
                                            type="date"
                                            variant="outlined"
                                            density="comfortable"
                                        />
                                        <v-text-field
                                            v-model="eventForm.title"
                                            label="タイトル"
                                            variant="outlined"
                                            density="comfortable"
                                        />
                                        <v-textarea
                                            v-model="eventForm.description"
                                            label="説明"
                                            variant="outlined"
                                            density="comfortable"
                                            rows="3"
                                            hide-details
                                        />
                                    </v-card-text>
                                    <v-card-actions>
                                        <v-spacer />
                                        <v-btn @click="eventDialog = false">キャンセル</v-btn>
                                        <v-btn color="primary" @click="saveEvent">保存</v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-dialog>
                            <div>
                                <v-btn variant="text" @click="db.load()">イベントデータをDBから読み込み</v-btn>
                                <v-btn variant="text" @click="db.save()">イベントデータをDBへ保存</v-btn>
                                <v-btn variant="text" @click="db.clear()">DBに保存されたデータをクリア</v-btn>
                            </div>
                        </v-container>
                    </v-fade-transition>
                    <v-fade-transition mode="out-in">
                        <div
                            v-if="container_visible"
                            class="d-flex flex-column"
                            style="position: fixed; top: 2rem; right: 2rem; z-index: 999;"
                        >
                            <v-btn
                                icon
                                variant="plain"
                                @click="dialog_settings()"
                            ><v-icon icon="mdi-cog" /></v-btn>
                            <v-btn
                                icon
                                variant="plain"
                                @click="theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'"
                            ><v-icon :icon="theme.global.current.value.dark ? 'mdi-weather-night' : 'mdi-white-balance-sunny'" /></v-btn>
                        </div>
                    </v-fade-transition>
                </v-main>
                <v-footer class="justify-center pa-2" style="margin-bottom: env(safe-area-inset-bottom); opacity: 0.25; background-color: transparent;" app>
                    <span class="text-body-2">
                        © 2025 <a
                            style="color: inherit;"
                            href="https://kanaaa224.github.io/"
                            target="_blank"
                            rel="noopener"
                        >kanaaa224</a>. All rights reserved.
                    </span>
                </v-footer>
            </v-app>
        `
    });

    const vuetify = createVuetify({
        theme: {
            defaultTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
            themes: {
                light: {
                    dark: false,
                    colors: {
                        background: '#fff',
                        surface:    '#fff',
                        primary:    '#2196f3',
                        secondary:  '#444',
                        error:      '#c23131'
                    }
                },
                dark: {
                    dark: true,
                    colors: {
                        background: '#222',
                        surface:    '#292929',
                        primary:    '#2196f3',
                        secondary:  '#eee',
                        error:      '#c23131'
                    }
                }
            }
        }
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // App インスタンスをマウント

    try {
        await api.connect();
    } catch(e) {
        console.error(e);
    }

    app.use(vuetify).mount('#app');
})();