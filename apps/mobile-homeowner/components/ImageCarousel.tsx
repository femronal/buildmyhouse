import { View, Text, Image, ScrollView, useWindowDimensions } from "react-native";
import { useState, useRef } from "react";

interface CarouselImage {
  url: string;
  label: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  height?: number;
}
export default function ImageCarousel({ images, height = 140 }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { width: viewportWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const effectiveWidth = containerWidth > 0 ? containerWidth : viewportWidth;

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const imageWidth = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(contentOffset / imageWidth);
    setActiveIndex(index);
  };

  return (
    <View
      className="relative"
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width > 0 && Math.abs(width - containerWidth) > 1) {
          setContainerWidth(width);
        }
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((image, index) => (
          <View key={index} style={{ width: effectiveWidth, height }} className="relative">
            <Image
              source={{ uri: image.url }}
              style={{ width: effectiveWidth, height }}
              resizeMode="cover"
            />
            <View className="absolute bottom-2 left-2 bg-black/70 rounded-full px-3 py-1">
              <Text 
                className="text-white text-xs"
                style={{ fontFamily: 'Poppins_500Medium' }}
              >
                {image.label}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
      {/* Dots Indicator */}
      <View className="absolute bottom-2 right-2 flex-row">
        {images.map((_, index) => (
          <View
            key={index}
            className={`w-1.5 h-1.5 rounded-full mx-0.5 ${
              index === activeIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
