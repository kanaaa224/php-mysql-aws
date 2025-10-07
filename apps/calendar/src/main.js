const { createApp, ref, onMounted, nextTick, reactive } = Vue;
const { createVuetify, useTheme, useDisplay } = Vuetify;

(async () => {
    let api_default_endpoint_url = API_ENDPOINTS_URLS[0];

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

    const app = createApp({
        setup() {
            const theme   = useTheme();
            const display = useDisplay();

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            const developer = ref({});

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            const dialog_settings_visible = ref(false);

            const dialog_settings = () => {
                if(!dialog_settings_visible.value) {
                    dialog_settings_visible.value = true;

                    return;
                }
            };

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
                        <v-container v-if="container_visible"></v-container>
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

    try {
        await api.connect();
    } catch(e) {
        console.error(e);
    }

    app.use(vuetify).mount('#app');
})();