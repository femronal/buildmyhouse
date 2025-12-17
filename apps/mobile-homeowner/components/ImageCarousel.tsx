import { View, Text, Image, ScrollView, Dimensions } from "react-native";
import { useState, useRef } from "react";

interface CarouselImage {
  url: string;
  label: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ImageCarousel({ images, height = 140 }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const imageWidth = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(contentOffset / imageWidth);
    setActiveIndex(index);
  };

  return (
    <View className="relative">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((image, index) => (
          <View key={index} style={{ width: '100%' }} className="relative">
            <Image
              source={{ uri: image.url }}
              style={{ height }}
              className="w-full"
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
