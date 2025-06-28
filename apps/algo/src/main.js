const { createApp, ref, onMounted, nextTick } = Vue;
const { createVuetify, useTheme } = Vuetify;

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
                    surface:    '#222',
                    primary:    '#2196f3',
                    secondary:  '#eee',
                    error:      '#c23131'
                }
            }
        }
    }
});

const app = createApp({
    setup() {
        const logging = (d = '') => {
            console.log(`[ ${(new Date()).toISOString()} ] ${d}`);
        };

        const isObject = function(value) {
            return value !== null && typeof value === 'object';
        };

        const LS_KEY = location.pathname;

        const storageSetData = (value = {}, key = '') => {
            const lsKey = LS_KEY ?? location.pathname;

            let setData = key ? Object.assign(storageGetData() ?? {}, { [key]: value }) : value;

            if(!isObject(setData)) return false;

            setData = JSON.stringify(setData);

            localStorage.setItem(lsKey, setData);

            return true;
        };

        const storageGetData = (key = '') => {
            const lsKey = LS_KEY ?? location.pathname;

            let lsData = localStorage.getItem(lsKey);

            if(!lsData) return null;

            lsData = JSON.parse(lsData);

            if(!isObject(lsData)) return false;

            if(key) return key in lsData ? lsData[key] : null;

            return lsData;
        };

        const randomHex = () => {
            return [...Array(16)].map(()=>"0123456789abcdef"[Math.floor(Math.random()*16)]).join('');
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const callAPI = async (uri = '', queries = '', requestBody = null, endpoint = API_ENDPOINTS[0]) => {
            uri = `${endpoint}${uri}`;

            if(queries) uri += /\?/.test(uri) ? `&${queries}` : `?${queries}`;

            let request = { method: 'GET' };

            if(requestBody) request = { method: 'POST', body: JSON.stringify(requestBody) };

            const response = await fetch(uri, request);
            const data     = await response.json();

            if(!response.ok) throw new Error(`api-bad-status: ${response.status}`);

            return data;
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const snackbar_visible = ref(false);
        const snackbar_message = ref('');
        const snackbar_color   = ref('');
        const snackbar_time    = ref(5000);

        const snackbar = (message = null, color = null, time = null) => {
            if(!snackbar_visible.value) {
                snackbar_message.value = message ?? snackbar_message.value;
                snackbar_color.value   = color   ?? snackbar_color.value;
                snackbar_time.value    = time    ?? snackbar_time.value;
                snackbar_visible.value = true;
            }
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const dialog_loading_visible = ref(false);
        const dialog_loading_title   = ref('');
        const dialog_loading_icon    = ref('');

        const dialog_loading = (title = null, icon = null) => {
            if(!dialog_loading_visible.value) {
                dialog_loading_title.value   = title ?? dialog_loading_title.value;
                dialog_loading_icon.value    = icon  ?? dialog_loading_icon.value;
                dialog_loading_visible.value = true;
            }
        };

        const dialog_settings_visible = ref(false);

        const dialog_settings = (command = '') => {
            dialog_settings_visible.value = true;

            switch(command) {
                case 'local-storage-clear': {
                    if(storageSetData()) snackbar('ローカルストレージをクリアしました', 'success');

                    break;
                }
            }
        };

        const dialog_select_mode_visible = ref(false);
        const dialog_select_mode_radio   = ref('');

        const dialog_select_mode = async () => {
            if(!dialog_select_mode_visible.value) {
                dialog_select_mode_visible.value = true;

                return;
            }

            if(!dialog_select_mode_radio.value) return;

            await game_start(dialog_select_mode_radio.value);

            dialog_select_mode_visible.value = false;
        };

        const dialog_select_single_start_mode_visible = ref(false);
        const dialog_select_single_start_mode_radio   = ref('');

        const dialog_select_single_start_mode = async () => {
            if(!dialog_select_single_start_mode_visible.value) {
                dialog_select_single_start_mode_visible.value = true;

                return;
            }

            if(!dialog_select_single_start_mode_radio.value) return;

            await game_start(dialog_select_single_start_mode_radio.value);

            dialog_select_single_start_mode_visible.value = false;
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const game = ref({});

        const game_initialize = () => {
            game.value = {
                mode: '',
                state: 0,

                cards_size: { x: 0, y: 0 },
                cards: [],
                cards_status: [],
                cards_queue:  []
            };
        };

        const game_update = async () => {
            for(let i = 0; i < game.value.cards.length; i++) {
                for(let j = 0; j < game.value.cards[i].length; j++) {
                    let num = game.value.cards_status[i][j];

                    game.value.cards[i][j] = {
                        num: Math.ceil(num / 2),
                        color: (num % 2 === 0) ? 'black' : 'white'
                    };
                }
            }

            if(game.value.mode == 'single_continue') {
                let session = storageGetData('session');

                try {
                    const response = await callAPI('', '', { method: 'db-data-set', params: { name: `algo-${session}`, data: game.value } }, API_ENDPOINTS[1]);

                    if(response.data.result != 'success') throw new Error('api-call-failed');
                } catch(e) {
                    logging(e);

                    snackbar('APIとの処理でエラーが起きました', 'error');
                }
            }
        };

        const game_create = () => {
            let size_x = 5;
            let size_y = 8;

            game.value.cards_size = { x: size_x, y: size_y };

            for(let i = 0; i < size_x; i++) {
                game.value.cards[i] = [];

                for(let j = 0; j < size_y; j++) {
                    game.value.cards[i][j] = {
                        num: 0,
                        color: 'white'
                    };
                }
            }

            for(let i = 0; i < size_x; i++) {
                game.value.cards_status[i] = [];

                for(let j = 0; j < size_y; j++) {
                    game.value.cards_status[i][j] = 0;
                }
            }

            let max_card_num = (size_x - 2) * size_y;

            const numbers = Array.from({ length: max_card_num }, (_, i) => i + 1);

            for(let i = numbers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));

                [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
            }

            game.value.cards_queue = numbers;

            for(let j = 0; j < size_y; j++) {
                game.value.cards_status[Math.floor(size_x / 2)][j] = game.value.cards_queue.shift();
            }
        };

        const game_prepare = async () => {
            if(game.value.mode == 'single_continue') {
                let session  = storageGetData('session');
                let response = null;

                try {
                    response = await callAPI('', '', { method: 'db-data-get', params: { name: `algo-${session}` } }, API_ENDPOINTS[1]);

                    if(response.data.result == 'success') {
                        game.value = response.data.value;
                    } else {
                        game_create();
                    }
                } catch(e) {
                    logging(e);

                    snackbar('APIとの処理でエラーが起きました', 'error');
                }
            } else {
                game_create();
            }

            game_update();
        };

        const game_start = async (mode = '') => {
            let session = storageGetData('session');

            switch(mode) {
                case 'single': {
                    if(!session) return game_start('single_new');

                    return dialog_select_single_start_mode();
                }

                case 'single_new': {
                    session = randomHex();

                    storageSetData(session, 'session');

                    return game_start('single_continue');
                }

                case 'single_continue':
                case 'offline': {
                    game_initialize();

                    game.value.mode = mode;

                    break;
                }

                default:
                    return;
            }

            game_prepare();

            container_visible.value = true;
        };

        const game_over = () => {
            window.alert('ゲームオーバー');

            if(game.value.mode == 'single_continue') storageSetData(null, 'session');

            location.reload();
        }

        const game_check = () => {
            let size_x = game.value.cards_size.x;
            let size_y = game.value.cards_size.y;
            let center = Math.floor(size_x / 2);

            for(let j = 0; j < size_y; j++) {
                let c = game.value.cards_status[center][j];

                let num = 0;

                for(let i = (center - 1); i >= 0; i--) {
                    if(game.value.cards_status[i][j] == 0) continue;

                    if(!num) {
                        num = game.value.cards_status[i][j];

                        continue;
                    }

                    if(c > num && num > game.value.cards_status[i][j]) {
                        num = game.value.cards_status[i][j];
                    } else if(c < num && num < game.value.cards_status[i][j]) {
                        num = game.value.cards_status[i][j];
                    } else {
                        game_over();

                        return;
                    }
                }

                num = 0;

                for(let i = (center + 1); i < size_x; i++) {
                    if(game.value.cards_status[i][j] == 0) continue;

                    if(!num) {
                        num = game.value.cards_status[i][j];

                        continue;
                    }

                    if(c > num && num > game.value.cards_status[i][j]) {
                        num = game.value.cards_status[i][j];
                    } else if(c < num && num < game.value.cards_status[i][j]) {
                        num = game.value.cards_status[i][j];
                    } else {
                        game_over();

                        return;
                    }
                }
            }
        };

        const game_placing_card = (x = 0, y = 0) => {
            let size_x = game.value.cards_size.x;
            let size_y = game.value.cards_size.y;
            let center = Math.floor(size_x / 2);

            if(center == x) {
                snackbar('ここには置けません');

                return;
            }

            let num = 0;

            for(let i = 0; i < game.value.cards.length; i++) {
                num += game.value.cards_status[i][y] != 0 ? 1 : 0;
            }

            if(num >= Math.ceil(size_x / 2)) {
                snackbar('もう置けません');

                return;
            }

            if(center > x) {
                for(let i = center; i > x; i--) {
                    if(game.value.cards_status[i][y] == 0) {
                        snackbar('間にカードがありません');

                        return;
                    }
                }
            }

            if(center < x) {
                for(let i = center; i < x; i++) {
                    if(game.value.cards_status[i][y] == 0) {
                        snackbar('間にカードがありません');

                        return;
                    }
                }
            }

            if(center > x) {
                if(game.value.cards_status[x][y] != 0) {
                    game.value.cards_status[x - 1][y] = game.value.cards_status[x][y];
                }
            }

            if(center < x) {
                if(game.value.cards_status[x][y] != 0) {
                    game.value.cards_status[x + 1][y] = game.value.cards_status[x][y];
                }
            }

            game.value.cards_status[x][y] = game.value.cards_queue.shift();

            game_update();
            game_check();
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const container_visible = ref(false);
        const developer         = ref({});

        const onLoad = async () => {
            developer.value = await callAPI();

            ((l) => (l.href = developer.value.avatar_url, document.head.appendChild(l)))(document.querySelector("link[rel='icon']")             || Object.assign(document.createElement("link"), { rel: "icon" }));
            ((l) => (l.href = developer.value.avatar_url, document.head.appendChild(l)))(document.querySelector("link[rel='apple-touch-icon']") || Object.assign(document.createElement("link"), { rel: "apple-touch-icon" }));

            await dialog_select_mode();
        };

        const theme = useTheme();

        onMounted(() => {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                theme.global.name.value = e.matches ? 'dark' : 'light';
            });

            window.addEventListener('load', onLoad);
        });

        const APP_VERSION = 'v1.0';
        const APP_NAME    = 'ALGO ゲーム';

        document.title = APP_NAME;

        return {
            theme,

            APP_VERSION,
            APP_NAME,

            snackbar_visible,
            snackbar_message,
            snackbar_color,
            snackbar_time,
            snackbar,

            dialog_loading_visible,
            dialog_loading_title,
            dialog_loading_icon,
            dialog_loading,
            dialog_settings_visible,
            dialog_settings,
            dialog_select_mode_visible,
            dialog_select_mode_radio,
            dialog_select_mode,
            dialog_select_single_start_mode_visible,
            dialog_select_single_start_mode_radio,
            dialog_select_single_start_mode,

            game,
            game_placing_card,
            developer,

            container_visible
        }
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    template: `
        <v-app>
            <v-snackbar
                v-model="snackbar_visible"
                :timeout="snackbar_time"
                :color="snackbar_color"
            >{{ snackbar_message }}</v-snackbar>
            <v-dialog
                v-model="dialog_loading_visible"
                max-width="320"
                persistent
            >
                <v-list
                    class="py-2"
                    color="primary"
                    elevation="12"
                    rounded="lg"
                >
                    <v-list-item
                        :prepend-icon="dialog_loading_icon"
                        :title="dialog_loading_title"
                    >
                        <template v-slot:prepend>
                            <div class="pe-4">
                                <v-icon color="primary" size="x-large"></v-icon>
                            </div>
                        </template>
                        <template v-slot:append>
                            <v-progress-circular
                                indeterminate="disable-shrink"
                                size="16"
                                width="2"
                            ></v-progress-circular>
                        </template>
                    </v-list-item>
                </v-list>
            </v-dialog>
            <v-dialog
                v-model="dialog_settings_visible"
                transition="dialog-bottom-transition"
                fullscreen
            >
                <v-card>
                    <v-toolbar>
                        <v-toolbar-items>
                            <v-btn
                                icon="mdi-close"
                                @click="dialog_settings_visible = false"
                            ></v-btn>
                        </v-toolbar-items>
                        <v-toolbar-title>設定</v-toolbar-title>
                    </v-toolbar>
                    <v-list lines="two">
                        <v-list-subheader>General</v-list-subheader>
                        <v-list-item
                            title="ローカルストレージをクリア"
                            subtitle="ブラウザに保存されたアプリケーションデータを全て削除します"
                            @click="dialog_settings('local-storage-clear')"
                        ></v-list-item>
                        <v-divider></v-divider>
                        <v-list-subheader>アプリケーション</v-list-subheader>
                        <v-list-item
                            title="バージョン"
                            :subtitle="APP_VERSION"
                        ></v-list-item>
                        <v-divider></v-divider>
                        <v-list-item
                            class="text-center"
                            subtitle="© 2025 kanaaa224. All rights reserved."
                            link
                            href="https://kanaaa224.github.io/"
                            target="_blank"
                            rel="noopener"
                        ></v-list-item>
                    </v-list>
                </v-card>
            </v-dialog>
            <v-dialog
                v-model="dialog_select_mode_visible"
                max-width="500"
                persistent
            >
                <v-card
                    prepend-icon="mdi-play"
                    title="プレイモードを選択"
                >
                    <v-card-text>
                        <v-radio-group
                            v-model="dialog_select_mode_radio"
                            :messages="dialog_select_mode_radio ? 'モードが選択されました' : 'モードを選択してください'"
                        >
                            <v-radio
                                label="シングルプレイ"
                                value="single"
                            ></v-radio>
                            <!-- <v-radio
                                label="マルチプレイ"
                                value="multiplayer"
                            ></v-radio> -->
                            <v-radio
                                label="オフラインプレイ（APIに接続しない）"
                                value="offline"
                            ></v-radio>
                        </v-radio-group>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            class="ms-auto"
                            variant="tonal"
                            text="スタート"
                            color="primary"
                            @click="dialog_select_mode()"
                        ></v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
            <v-dialog
                v-model="dialog_select_single_start_mode_visible"
                max-width="500"
                persistent
            >
                <v-card
                    prepend-icon="mdi-play"
                    title="前回の続きから始めますか？"
                >
                    <v-card-text>
                        <v-radio-group
                            v-model="dialog_select_single_start_mode_radio"
                            :messages="dialog_select_single_start_mode_radio ? 'モードが選択されました' : 'モードを選択してください'"
                        >
                            <v-radio
                                label="新しく開始"
                                value="single_new"
                            ></v-radio>
                            <v-radio
                                label="続きから開始"
                                value="single_continue"
                            ></v-radio>
                        </v-radio-group>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            class="ms-auto"
                            variant="tonal"
                            text="スタート"
                            color="primary"
                            @click="dialog_select_single_start_mode()"
                        ></v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
            <v-main>
                <transition name="fade">
                    <v-container v-if="container_visible">
                        <div class="algo-game">
                            <div class="container">
                                <div
                                    class="lane"
                                    v-for="j in game.cards_size.y"
                                    :key="'col-' + j"
                                >
                                    <div
                                        class="card clickable"
                                        v-for="i in game.cards_size.x"
                                        :key="'row-' + i"
                                        :style="game.cards[i - 1][j - 1].num !== 0 ? {
                                            backgroundColor: game.cards[i - 1][j - 1].color === 'white' ? 'white' : '#111',
                                            color:           game.cards[i - 1][j - 1].color === 'white' ? 'black' : 'white'
                                        } : {}"
                                        @click="game_placing_card(i - 1, j - 1)"
                                    >
                                        <span v-if="game.cards[i - 1][j - 1].num !== 0">{{ game.cards[i - 1][j - 1].num }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </v-container>
                </transition>
                <transition name="fade">
                    <div
                        class="d-flex flex-column"
                        style="position: fixed; top: 2rem; right: 2rem; z-index: 999;"
                    >
                        <v-btn
                            v-if="container_visible"
                            icon
                            variant="plain"
                            @click="dialog_settings()"
                        ><v-icon>mdi-cog</v-icon></v-btn>
                        <v-btn
                            v-if="container_visible"
                            icon
                            variant="plain"
                            @click="theme.global.name.value = theme.global.name.value === 'dark' ? 'light' : 'dark'"
                        ><v-icon>{{ theme.global.name.value === 'dark' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon></v-btn>
                    </div>
                </transition>
            </v-main>
            <v-footer
                app
                class="justify-center pa-2"
                style="opacity: 0.25; background-color: transparent;"
            >
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

app.use(vuetify).mount('#app');