const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./usermodel');

const Tourschema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: [true, 'name is taken'],
      required: [true, 'name is required'],
      trim: true,
      validate: [
        {
          validator: function (val) {
            if (val.length >= 10 && val.length <= 40) {
              return true;
            }
            return false;
          },
          message: 'name must be bw 10 to 40 characters',
        },
        // ,
        // {
        //   validator: validator.isAlpha,
        //   m  essage: 'can only have alphas',
        // },
      ],
    },

    slug: String,
    duration: {
      type: Number,
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'a tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'a tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'values must beon of the three from easy medium difficult',
      },
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: true },
    pricediscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.pricediscount;
        },
        message: '({VALUE}) iss too much',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have description'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'too low'],
      max: [5, 'too large'],
      set: (val) => Math.round(val * 10) / 10,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'a tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'users' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
Tourschema.index({ price: 1, ratingsAverage: -1 });
Tourschema.index({ slug: 1 });
Tourschema.index({ startLocation: '2dsphere' });
//Vitual Poopulatez
Tourschema.virtual('reviews', {
  ref: 'reviews',
  foreignField: 'tour',
  localField: '_id',
});
Tourschema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

Tourschema.pre(/^find/, function (next) {
  this.find({
    secretTour: {
      $ne: true,
    },
  });
  next();
});
Tourschema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
// Tourschema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //console.log(this.pipeline());
//   next();
// });
const Tours = mongoose.model('tours', Tourschema);

module.exports = Tours;
