class BinarySearch {
    constructor(min = 0, max = 0, numOfTimes = 0) {
        if(min >= max || numOfTimes <= 0) throw new Error('引数が不正');

        this._min_ = this.min = min; // 範囲の下限
        this._max_ = this.max = max; // 範囲の上限

        this._numOfTimes_ = this.numOfTimes = numOfTimes; // 探索回数
    }

    mid() {
        return Math.floor((this.min + this.max) / 2); // 現在の中央値を計算
    }

    yes(includeMid = false) {
        this.min = this.mid() + (includeMid ? 0 : 1); // 探索値は mid より大きい

        this.numOfTimes--;
    }

    no(includeMid = true) {
        this.max = this.mid() - (includeMid ? 0 : 1); // 探索値は mid 未満

        this.numOfTimes--;
    }

    result() {
        return this.min === this.max || !this.numOfTimes ? this.min : null; // 結果を取得（範囲が一つに絞られた または 探索回数を使い切った 場合）
    }

    reset() {
        this.min = this._min_;
        this.max = this._max_;

        this.numOfTimes = this._numOfTimes_;
    }
}