class Calendar {
    constructor() {
        this.events      = [];
        this.currentDate = new Date();
        this.viewMode    = 'month';

        this.loadEvents();
    }

    // ローカルストレージから読み込み
    loadEvents() {
        const stored = localStorage.getItem('calendar_events');

        if(stored) this.events = JSON.parse(stored);
    }

    // ローカルストレージに保存
    saveEvents() {
        localStorage.setItem('calendar_events', JSON.stringify(this.events));
    }

    // イベント追加
    addEvent(date, title, description = '') {
        this.events.push({
            id: Date.now().toString(),

            date, title, description
        });

        this.saveEvents();
    }

    // イベント更新
    updateEvent(id, date, title, description = '') {
        const event = this.events.find(e => e.id === id);

        if(event) {
            event.date        = date;
            event.title       = title;
            event.description = description;

            this.saveEvents();
        }
    }

    // イベント削除
    deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);

        this.saveEvents();
    }

    // 指定日のイベント取得
    getEventsForDate(date) {
        return this.events.filter(e => e.date === date);
    }

    // 指定月のイベント取得
    getEventsForMonth(year, month) {
        const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`; // month は 0 始まりのため +1

        return this.events.filter(e => e.date.startsWith(monthStr));
    }

    // 指定年のイベント取得
    getEventsForYear(year) {
        return this.events.filter(e => e.date.startsWith(String(year)));
    }

    // ビューモード設定
    setViewMode(mode) {
        this.viewMode = mode;
    }

    // 現在の日付設定
    setCurrentDate(date) {
        this.currentDate = new Date(date);
    }

    // 現在の年取得
    getCurrentYear() {
        return this.currentDate.getFullYear();
    }

    // 現在の月取得
    getCurrentMonth() {
        return this.currentDate.getMonth();
    }

    // 現在の日取得
    getCurrentDay() {
        return this.currentDate.getDate();
    }

    // 月の日数と開始曜日取得
    getMonthDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay  = new Date(year, month + 1, 0);

        const daysInMonth    = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        return {
            daysInMonth, startDayOfWeek,
            year, month
        }
    }

    // 次の期間へ移動
    nextPeriod() {
        switch(this.viewMode) {
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                break;

            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                break;

            case 'year':
                this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
                break;

            default:
                break;
        }

        this.currentDate = new Date(this.currentDate);
    }

    // 前の期間へ移動
    prevPeriod() {
        switch(this.viewMode) {
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                break;

            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                break;

            case 'year':
                this.currentDate.setFullYear(this.currentDate.getFullYear() - 1);
                break;

            default:
                break;
        }

        this.currentDate = new Date(this.currentDate);
    }

    // 今日の日付へ移動
    today() {
        this.currentDate = new Date();
    }

    // 日付を "YYYY-MM-DD" 形式にフォーマット
    formatDate(date) {
        if(typeof date === 'string') return date;

        const year  = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day   = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }
}