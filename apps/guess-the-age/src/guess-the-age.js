class GuessTheAge {
    constructor(min = 0, max = 0, numOfTimes = 0) {
        if(min >= max || numOfTimes <= 0) throw new Error('min は max より小さくなければなりません');

        this._min_ = this.min = min; // 下限
        this._max_ = this.max = max; // 上限

        this.numOfTimes = numOfTimes; // 質問回数
    }

    mid() {
        return Math.floor((this.min + this.max) / 2); // 現在の中央値を計算
    }

    yes() {
        this.min = this.mid() + 1; // 年齢は mid より大きい
    }

    no() {
        this.max = this.mid(); // 年齢は mid 未満
    }

    result() {
        return this.min === this.max ? this.min : null; // 結果を取得（範囲が1つに絞られた場合）
    }

    reset() {
        this.min = this._min_;
        this.max = this._max_;
    }
}