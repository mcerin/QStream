let Stream = require('./base_stream.js')
let Utils = require('../utils/index.js')

/**
 * WaveformGenerator
 * @extends Stream
 */
class WaveformGenerator extends Stream {
    /**
     * Generates instances with 21 numeric attributes and 3 classes, based
     * on a random differentiation of some base waveforms. Supports noise
     * addition, but in this case the generator will have 40 attribute
     * instances
     * 
     * @param {boolean} has_noise - If True additional 19 insignificant will be added. (Default: False) 
     * @param {int}  random_state - The seed for pseudo random generator (Default: null).
     * 
     */
    constructor(has_noise = false, random_state = null) {
        super();
        this.original_random_state = false;
        this.random_state = random_state;
        this.has_noise = has_noise;
        this.n_featu = 21;
    	this.n_num_features = this.n_featu;
        this.n_classes = 3;
        this.n_targets = 1;
        this.h_function = [[0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                           [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0],
                           [0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0]]
        this.name = "Waveform Generator";
        this._configure();
    };

    _configure() {
        if (this.has_noise) {
            this.n_num_features = 40;
        };
        this.n_features = this.n_num_features;
        this.feature_names = [];
        for (let i = 0; i < this.n_features; i++) {
            this.feature_names.push('att_num_' + i);
        };
        this.target_names = ['target_0'];
        this.target_values = []
        for (let i = 0; i < this.n_classes; i++) {
            this.target_values.push(i);
        };
    };

    /** Retrieve the value of the option: add noise.
     *
     * @return {boolean}  True if the noise is added.
     * 
     */
    has_noise() {
        return (this.has_noise)
    };

    /** Set the value of the option: add noise.
     *
     * @param {boolean}     has_noise   Identifier of whether the generator will include noisy features.
     */
    set_has_noise(has_noise) {
        if (typeof(has_noise) === 'boolean') {
            this.has_noise = has_noise;
            this.configure();
        } else {
            throw new TypeError('has_noise should be boolean, \'' + typeof(has_noise) +  '\' was passed');
        };
    };

    /**
     * Should be called before generating the samples.
     */
    prepare_for_use() {
        this.original_random_state = this.random_state == null ? false : true;
        this.random = new Utils.Random(this.random_state);
        this.sample_idx = 0
    };

    /**  next_sample
     *
     * An instance is generated based on the parameters passed. If noise
     * is included the total number of features will be 40, if it's not
     * included there will be 21 attributes. In both cases there is one
     * classification task, which chooses one between three labels.
     *
     * After the number of attributes is chosen, the algorithm will randomly
     * choose one of the hard coded waveforms, as well as random multipliers.
     * For each attribute, the actual value generated will be a a combination
     * of the hard coded functions, with the multipliers and a random value.
     *
     * Furthermore, if noise is added the features from 21 to 40 will be
     * replaced with a random normal value.
     * 
     * @param  {number} batch_size - The numbet of samples to return,
     * @return {array} - Return an array with the features matrix and the labels matrix 
     *     for the batch_size samples that were requested.
     * 
     * @example 
     * 
     */
    next_sample(batch_size = 1) {
        let random = this.random;
        let data = [];
        let dimensions = [batch_size, this.n_features + 1];

        for (let i = 0; i < dimensions[0]; ++i) {
            data.push(new Array(dimensions[1]).fill(0));
        };

        for (let j = 0; j < batch_size; j++) {
            this.sample_idx += 1;
            let group = random.random_int(this.original_random_state, 0, this.n_classes);
            let choice_a = group == 2 ? 1 : 0;
            let choice_b = group == 0 ? 1 : 2;
            let multiplier_a = random.random(this.original_random_state);
            let multiplier_b = 1.0 - multiplier_a;

            for (let i = 0; i <= this.n_featu - 1; i++) {
                data[j][i] = multiplier_a * this.h_function[choice_a][i] 
                           + multiplier_b * this.h_function[choice_b][i] 
                           + random.random_gauss(this.original_random_state);
            };

            if (this.has_noise) {
                for (let i = this.n_featu; i < this.n_num_features; i++) {
                    data[j][i] = random.random_gauss(this.original_random_state);
                };
            };

            data[j][data[j].length - 1] = group;
        };

        this.current_sample_x = [];
        this.current_sample_y = [];

        for (let k = 0; k < batch_size; k++) {
            this.current_sample_x.push(data[k].slice(0, this.n_num_features));
            this.current_sample_y.push(data[k][this.n_num_features]);
        };

        return ([this.current_sample_x, this.current_sample_y]);
    };

    get_info() {
        let info = 'Waveform Generator:'
                    + '\n n_classes: ' + this.n_classes
                    + '\n n_num_features: ' + this.n_num_features
                    + '\n n_cat_features: ' + this.n_cat_features
                    + '\n has_noise: ' + this.has_noise
                    //+'\n random_state: ' + this._original_random_state;

        return (info);
    };
};
module.exports = WaveformGenerator;