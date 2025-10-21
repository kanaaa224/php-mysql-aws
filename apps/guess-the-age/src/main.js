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

            const guessTheAge = ref(new BinarySearch(20, 35, 4)); // デフォルト: 年齢範囲の下限 20、年齢範囲の上限 35、質問回数 4

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // ダイアログ

            const dialog_settings_visible = ref(false);

            const dialog_settings = () => {
                if(!dialog_settings_visible.value) {
                    dialog_settings_visible.value = true;

                    return;
                }
            };

            const dialog_select_range_visible   = ref(false);
            const dialog_select_range_value_max = ref(guessTheAge.value.max);        // 年齢範囲の上限
            const dialog_select_range_value_min = ref(guessTheAge.value.min);        // 年齢範囲の下限
            const dialog_select_range_value_not = ref(guessTheAge.value.numOfTimes); // 質問回数

            const dialog_select_range = (update = false) => {
                if(!dialog_select_range_visible.value) {
                    dialog_select_range_visible.value = true;

                    return;
                }

                if(update) {
                    // 範囲の上限値と下限値から二分探索の回数を求める
                    // (max - min + 1) | 候補の数（20 ~ 35 なら 35 - 20 + 1 = 16 通り）
                    // Math.log2(...)  | その候補数を2で何回割れば1になるか（ = 二分探索に必要な質問回数）
                    // Math.ceil(...)  | 小数点を切り上げ、ちょうど割り切れない範囲でも質問を一回多くしてカバーする
                    dialog_select_range_value_not.value = Math.ceil(Math.log2(dialog_select_range_value_max.value - dialog_select_range_value_min.value + 1));

                    return;
                }

                guessTheAge.value = new BinarySearch(dialog_select_range_value_min.value, dialog_select_range_value_max.value, dialog_select_range_value_not.value);

                dialog_select_range_visible.value = false;
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

                dialog_select_range();
            });

            return {
                api,

                theme,
                display,

                developer,
                guessTheAge,

                dialog_settings_visible,
                dialog_settings,
                dialog_select_range_visible,
                dialog_select_range_value_max,
                dialog_select_range_value_min,
                dialog_select_range_value_not,
                dialog_select_range,

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
                <v-dialog
                    v-model="dialog_select_range_visible"
                    max-width="500"
                >
                    <v-card
                        prepend-icon="mdi-numeric"
                        title="年齢範囲を設定"
                        text="二分探索法で求めるための年齢範囲を入力"
                    >
                        <v-card-text>
                            <v-number-input
                                label="上限年齢"
                                v-model="dialog_select_range_value_max"
                                :max="99"
                                :min="dialog_select_range_value_min"
                                @update:model-value="dialog_select_range(true)"
                            ></v-number-input>
                            <v-number-input
                                label="下限年齢"
                                v-model="dialog_select_range_value_min"
                                :max="dialog_select_range_value_max"
                                :min="0"
                                @update:model-value="dialog_select_range(true)"
                            ></v-number-input>
                            <v-number-input
                                label="質問回数"
                                v-model="dialog_select_range_value_not"
                                :max="99"
                                :min="0"
                            ></v-number-input>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer />
                            <v-btn
                                variant="plain"
                                text="Cancel"
                                @click="dialog_select_range_visible = false"
                                :disabled="dialog_select_range_loading"
                            />
                            <v-btn
                                variant="tonal"
                                text="OK"
                                color="primary"
                                @click="dialog_select_range()"
                                :disabled="dialog_select_range_loading"
                            />
                        </v-card-actions>
                    </v-card>
                </v-dialog>
                <v-main>
                    <v-fade-transition mode="out-in">
                        <v-container v-if="container_visible">
                            <div class="d-flex align-center justify-center" style="height: 90vh;">
                                <v-card class="card-shadow" elevation="0" :width="display.xs.value ? '90%' : '50%'">
                                    <v-card-title>年齢当て</v-card-title>
                                    <v-card-subtitle>あなたの年齢を当てます</v-card-subtitle>
                                    <div v-if="!guessTheAge.result()">
                                        <v-card-text class="text-center my-5">質問 その {{ guessTheAge._numOfTimes_ - guessTheAge.numOfTimes + 1 }}（全 {{ guessTheAge._numOfTimes_ }} 問）<br>あなたの年齢は {{ guessTheAge.mid() }} より上ですか？</v-card-text>
                                        <v-card-text>
                                            <div class="d-flex">
                                                <v-spacer />
                                                <v-btn
                                                    variant="text"
                                                    @click="guessTheAge.yes()"
                                                ><v-icon icon="mdi-circle-outline" /> YES</v-btn>
                                                <v-btn
                                                    variant="text"
                                                    @click="guessTheAge.no()"
                                                ><v-icon icon="mdi-close" /> NO</v-btn>
                                            </div>
                                        </v-card-text>
                                    </div>
                                    <div v-else>
                                        <v-card-text class="text-center my-5">あなたは {{ guessTheAge.result() }} 歳！</v-card-text>
                                        <v-card-text>
                                            <div class="d-flex">
                                                <v-spacer />
                                                <v-btn
                                                    variant="text"
                                                    @click="dialog_select_range()"
                                                ><v-icon icon="mdi-cog" /> 年齢範囲変更</v-btn>
                                                <v-btn
                                                    variant="text"
                                                    @click="guessTheAge.reset()"
                                                ><v-icon icon="mdi-replay" /> リプレイ</v-btn>
                                            </div>
                                        </v-card-text>
                                    </div>
                                </v-card>
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