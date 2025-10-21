class Calculator {
    constructor() {
        this.display = '0'; // 表示中の値
        this.label   = '';  // 直前の式
        this.history = [];  // 計算履歴

        this.memory = 0; // メモリ機能用
    }

    update(val) {
        this.display = val; // テキストフィールドの手入力更新時
    }

    // 計算処理
    evaluate() {
        try {
            const expr = this.display // 入力を安全に eval 可能な形に置換
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-');

            const result = Function(`return (${expr})`)(); // 安全な一行関数として評価

            if(result !== undefined && !isNaN(result)) {
                this.label   = this.display;
                this.display = String(result);

                this.history.push(`${this.label}=${result}`);
            }
        } catch {
            this.display = 'Error';
        }
    }

    // ボタン押下時の処理
    push(btn) {
        const isOperator = [ '+', '−', '×', '÷' ].includes(btn);

        switch(btn) {
            // メモリ系
            case 'MC':
                this.memory = 0;
                break;

            case 'MR':
                this.display = String(this.memory);
                break;

            case 'M+':
                this.memory += Number(this.display) || 0;
                break;

            case 'M-':
                this.memory -= Number(this.display) || 0;
                break;

            // 制御系
            case 'AC':
                this.display = '0';
                this.label   = '';
                break;

            case 'C':
                this.display = this.display.slice(0, -1) || '0';
                break;

            case '+/-':
                if(this.display.startsWith('-')) this.display = this.display.slice(1);
                else if(this.display !== '0')    this.display = '-' + this.display;
                break;

            // 演算子
            case '=':
                this.evaluate();
                break;

            // 数字、小数点、演算子
            default:
                if(this.display === '0' && !isOperator && btn !== '.') {
                    this.display = btn;
                } else {
                    this.display += btn;
                }
                break;
        }
    }
}